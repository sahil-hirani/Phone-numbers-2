import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SaleEntry from '@/models/SaleEntry';
import Agent from '@/models/Agent';




const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'active' | 'inactive'
    const agent = searchParams.get('agent');   // optional agent username

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const query: Record<string, unknown> = {};
    if (filter === 'active') {
      query.lastActivityDate = { $gte: cutoff };
    } else if (filter === 'inactive') {
      query.lastActivityDate = { $lt: cutoff };
    }
    if (agent && agent !== 'all') {
      query.assignedTo = agent;
    }

    const [entries, agents] = await Promise.all([
      SaleEntry.find(query).sort({ lastActivityDate: -1 }).lean(),
      Agent.find({}, { username: 1, _id: 0 }).sort({ username: 1 }).lean(),
    ]);

    return NextResponse.json({
      entries,
      agents: agents.map((a) => a.username),
    });
  } catch (err: any) {
    console.error('[GET /api/admin/clients]', err);
    return NextResponse.json({ entries: [], agents: [] }, { status: 500 });
  }
}
