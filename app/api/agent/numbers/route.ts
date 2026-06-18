import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import SaleEntry from '@/models/SaleEntry';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentUsername = (session.user as any).agentUsername;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let filter: Record<string, unknown>;

    if (status === 'connected') {
      filter = { assignedTo: agentUsername, status: 'connected', submittedAt: { $ne: null } };
    } else if (status === 'not_connected') {
      filter = { assignedTo: agentUsername, status: 'not_connected', submittedAt: { $ne: null } };
    } else {
      const saleNumbers = await SaleEntry.distinct('number', { assignedTo: agentUsername });
      filter = {
        assignedTo: agentUsername,
        status: 'pending',
        ...(saleNumbers.length > 0 ? { number: { $nin: saleNumbers } } : {}),
      };
    }

    const numbers = await PhoneNumber.find(filter).sort({ createdAt: 1 }).lean();
    const total = await PhoneNumber.countDocuments({ assignedTo: agentUsername });

    return NextResponse.json({ numbers, total });
  } catch (err: any) {
    console.error('[GET /api/agent/numbers]', err);
    return NextResponse.json({ numbers: [], total: 0 }, { status: 500 });
  }
}
