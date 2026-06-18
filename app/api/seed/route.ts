import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import Agent from '@/models/Agent';

function generatePhone(): string {
  const areas = ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309',
    '310', '311', '312', '313', '314', '315', '316', '317', '318', '319',
    '320', '321', '322', '323', '324', '325', '330', '331', '332', '333',
    '340', '341', '342', '343', '344', '345', '346', '347', '348', '349'];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const rest = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `0${area}${rest}`.slice(0, 11);
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const existing = await PhoneNumber.countDocuments({ uploadBatch: 'seed_batch' });
    if (existing > 0) {
      return NextResponse.json({ message: 'Seed data already exists', count: existing });
    }

    const agents = await Agent.find({}, { username: 1 });
    if (agents.length === 0) {
      return NextResponse.json({ error: 'Add agents first before seeding' }, { status: 400 });
    }

    const numbers: string[] = [];
    const seen = new Set<string>();
    while (numbers.length < 1000) {
      const num = generatePhone();
      if (!seen.has(num)) {
        seen.add(num);
        numbers.push(num);
      }
    }

    const agentCount = agents.length;
    const docs = numbers.map((num, index) => ({
      number: num,
      assignedTo: agents[index % agentCount].username,
      status: 'pending',
      uploadBatch: 'seed_batch',
    }));

    await PhoneNumber.insertMany(docs);

    const summary: Record<string, number> = {};
    agents.forEach((a) => (summary[a.username] = 0));
    docs.forEach((d) => { summary[d.assignedTo] = (summary[d.assignedTo] || 0) + 1; });

    return NextResponse.json({ message: '1000 numbers seeded successfully', distribution: summary });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
