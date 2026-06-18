import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const agentUsername = (session.user as any)?.agentUsername;
    if (role !== 'admin' && role !== 'agent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { connected, notConnected, whatsappDone, remark } = body;

    if (connected && notConnected) {
      return NextResponse.json({ error: 'Cannot be both connected and not connected' }, { status: 400 });
    }

    if (role === 'agent') {
      const owner = await PhoneNumber.findById(id).select({ assignedTo: 1 }).lean();
      if (!owner || owner.assignedTo !== agentUsername) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let status = 'pending';
    if (connected) status = 'connected';
    else if (notConnected) status = 'not_connected';

    const updated = await PhoneNumber.findByIdAndUpdate(
      id,
      {
        connected: !!connected,
        notConnected: !!notConnected,
        whatsappDone: !!whatsappDone,
        remark: (remark || '').slice(0, 200),
        status,
        submittedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Saved', number: updated });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
