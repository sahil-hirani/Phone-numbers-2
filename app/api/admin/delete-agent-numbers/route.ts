import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { agentUsername, password } = body;

    if (!agentUsername || !password) {
      return NextResponse.json({ error: 'Missing agentUsername or password' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Delete only FTD (pending), connected, and not_connected numbers for this agent.
    // Never touch numbers that are in SaleEntry (active/non-active) — those exist only in SaleEntry, not here.
    const result = await PhoneNumber.deleteMany({
      assignedTo: agentUsername,
      status: { $in: ['pending', 'connected', 'not_connected'] },
    });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} numbers for agent ${agentUsername}`,
      count: result.deletedCount,
    });
  } catch (err) {
    console.error('[Delete Agent Numbers API]:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
