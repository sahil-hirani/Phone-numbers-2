import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import SaleEntry from '@/models/SaleEntry';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentUsername = (session.user as any).agentUsername;
    await connectDB();

    // Numbers already in SaleEntry — excluded from FTD
    const saleNumbers = await SaleEntry.distinct('number', { assignedTo: agentUsername });

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const [ftd, connected, notConnected, active, noActive] = await Promise.all([
      PhoneNumber.countDocuments({
        assignedTo: agentUsername,
        status: 'pending',
        ...(saleNumbers.length > 0 ? { number: { $nin: saleNumbers } } : {}),
      }),
      PhoneNumber.countDocuments({ assignedTo: agentUsername, status: 'connected', submittedAt: { $ne: null } }),
      PhoneNumber.countDocuments({ assignedTo: agentUsername, status: 'not_connected', submittedAt: { $ne: null } }),
      SaleEntry.countDocuments({ assignedTo: agentUsername, lastActivityDate: { $gte: cutoff } }),
      SaleEntry.countDocuments({ assignedTo: agentUsername, lastActivityDate: { $lt: cutoff } }),
    ]);

    return NextResponse.json({ ftd, connected, notConnected, active, noActive });
  } catch (err: any) {
    console.error('[GET /api/agent/counts]', err);
    return NextResponse.json({ ftd: 0, connected: 0, notConnected: 0, active: 0, noActive: 0 });
  }
}
