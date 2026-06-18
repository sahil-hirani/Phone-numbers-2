import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Agent from '@/models/Agent';
import PhoneNumber from '@/models/PhoneNumber';
import SaleEntry from '@/models/SaleEntry';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentAgent = (session.user as any).agentUsername;
    await connectDB();

    const agents = await Agent.find({}, { username: 1, _id: 0 }).lean();
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const scored = await Promise.all(
      agents.map(async (a) => {
        const username = a.username;
        const [total, connected, notConnected, active, inactive] = await Promise.all([
          PhoneNumber.countDocuments({ assignedTo: username }),
          PhoneNumber.countDocuments({ assignedTo: username, status: 'connected' }),
          PhoneNumber.countDocuments({ assignedTo: username, status: 'not_connected' }),
          SaleEntry.countDocuments({ assignedTo: username, lastActivityDate: { $gte: cutoff } }),
          SaleEntry.countDocuments({ assignedTo: username, lastActivityDate: { $lt: cutoff } }),
        ]);

        const called = connected + notConnected;
        const callCompletion = total > 0 ? called / total : 0;
        const connectionRate = total > 0 ? connected / total : 0;
        const totalSales = active + inactive;
        const activeRetention = totalSales > 0 ? active / totalSales : 0;

        const score = callCompletion * 0.5 + connectionRate * 0.3 + activeRetention * 0.2;

        return { username, score };
      })
    );

    scored.sort((a, b) => b.score - a.score);

    const rank = scored.findIndex((s) => s.username === currentAgent) + 1;
    return NextResponse.json({ rank, totalAgents: scored.length });
  } catch (err: any) {
    console.error('[GET /api/agent/rank]', err);
    return NextResponse.json({ rank: 0, totalAgents: 0 }, { status: 500 });
  }
}
