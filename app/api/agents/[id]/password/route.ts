import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Agent from '@/models/Agent';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPassword } = await req.json();
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();
    const { id } = await params;

    const agent = await Agent.findById(id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await Agent.findByIdAndUpdate(id, {
      $set: { password: hashed },
      $inc: { tokenVersion: 1 },
    });

    return NextResponse.json({
      message: `Password updated for agent "${agent.username}". They will be logged out from all devices.`,
    });
  } catch (err) {
    console.error('[PATCH /api/agents/[id]/password] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
