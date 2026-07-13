import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import { verifyAdminPassword } from '@/lib/admin';

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

    // Verify admin password
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Reset ALL numbers for this agent — clears remarks, remark fields, status back to pending
    const result = await PhoneNumber.updateMany(
      { assignedTo: agentUsername },
      {
        $set: {
          status: 'pending',
          connected: false,
          notConnected: false,
          whatsappDone: false,
          remark: '',
          submittedAt: null,
        },
      }
    );

    return NextResponse.json({
      message: `Reset ${result.modifiedCount} numbers for agent ${agentUsername}`,
      count: result.modifiedCount,
    });
  } catch (err) {
    console.error('[Reset Agent API]:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
