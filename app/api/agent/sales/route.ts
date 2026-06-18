import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SaleEntry from '@/models/SaleEntry';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentUsername = (session.user as any).agentUsername;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'active' | 'inactive'

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    let query: Record<string, unknown>;
    if (filter === 'inactive') {
      query = { assignedTo: agentUsername, lastActivityDate: { $lt: cutoff } };
    } else {
      // active = within last 7 days
      query = { assignedTo: agentUsername, lastActivityDate: { $gte: cutoff } };
    }

    const entries = await SaleEntry.find(query).sort({ lastActivityDate: -1 }).lean();
    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error('[GET /api/agent/sales]', err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
