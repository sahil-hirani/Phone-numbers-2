import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import Agent from '@/models/Agent';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { numbers, assignTo } = await req.json();

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({ error: 'No numbers provided' }, { status: 400 });
    }

    const batchId = `batch_${Date.now()}`;
    let docs: { number: string; assignedTo: string; status: string; uploadBatch: string }[];

    if (assignTo && assignTo !== 'equal') {
      // Assign all numbers to a specific agent
      docs = numbers.map((num: string) => ({
        number: num.toString().trim(),
        assignedTo: assignTo,
        status: 'pending',
        uploadBatch: batchId,
      }));
    } else {
      // Equal distribution among all agents
      const agents = await Agent.find({}, { username: 1 });
      if (agents.length === 0) {
        return NextResponse.json({ error: 'No agents found. Please add agents first.' }, { status: 400 });
      }
      const agentCount = agents.length;
      docs = numbers.map((num: string, index: number) => ({
        number: num.toString().trim(),
        assignedTo: agents[index % agentCount].username,
        status: 'pending',
        uploadBatch: batchId,
      }));
    }

    // Pre-check: find which numbers already exist in the DB
    const existingNums = await PhoneNumber.find(
      { number: { $in: docs.map((d) => d.number) } },
      { number: 1 }
    ).lean();
    const existingSet = new Set(existingNums.map((n: any) => n.number));
    const newDocs = docs.filter((d) => !existingSet.has(d.number));
    const skippedCount = docs.length - newDocs.length;

    if (newDocs.length === 0) {
      return NextResponse.json(
        { error: `All ${docs.length} number(s) already exist in the system. No duplicates allowed.` },
        { status: 400 }
      );
    }

    await PhoneNumber.insertMany(newDocs);

    const summary: Record<string, number> = {};
    newDocs.forEach((d) => { summary[d.assignedTo] = (summary[d.assignedTo] || 0) + 1; });

    const msg = skippedCount > 0
      ? `${newDocs.length} numbers uploaded. ${skippedCount} duplicate(s) skipped.`
      : `${newDocs.length} numbers uploaded and distributed`;

    return NextResponse.json({
      message: msg,
      batchId,
      distribution: summary,
    });
  } catch (err: any) {
    console.error('[POST /api/numbers]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    const filter: Record<string, unknown> = agentId ? { assignedTo: agentId } : {};

    const [numbers, total] = await Promise.all([
      PhoneNumber.find(filter).sort({ createdAt: -1 }).lean(),
      PhoneNumber.countDocuments(filter),
    ]);

    let stats: { agentId: string; name: string; total: number; called: number; connected: number; not_connected: number }[] = [];
    try {
      const agents = await Agent.find({}, { username: 1 });
      stats = await Promise.all(
        agents.map(async (agent) => {
          const [agentTotal, connected, not_connected] = await Promise.all([
            PhoneNumber.countDocuments({ assignedTo: agent.username }),
            PhoneNumber.countDocuments({ assignedTo: agent.username, status: 'connected' }),
            PhoneNumber.countDocuments({ assignedTo: agent.username, status: 'not_connected' }),
          ]);
          const called = connected + not_connected;
          return { agentId: agent.username, name: agent.username, total: agentTotal, called, connected, not_connected };
        })
      );
    } catch (statsErr) {
      console.error('[GET /api/numbers] stats error (non-fatal):', statsErr);
    }

    return NextResponse.json({ numbers, total, stats });
  } catch (err: any) {
    console.error('[GET /api/numbers]', err);
    return NextResponse.json({ error: err?.message || 'Server error', numbers: [], total: 0, stats: [] }, { status: 500 });
  }
}
