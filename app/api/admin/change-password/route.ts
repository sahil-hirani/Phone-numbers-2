import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getOrCreateAdmin } from '@/lib/admin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
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
    const admin = await getOrCreateAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin account not configured' }, { status: 500 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await Admin.findByIdAndUpdate(admin._id, {
      $set: { password: hashed },
      $inc: { tokenVersion: 1 },
    });

    return NextResponse.json({
      message: 'Admin password updated. You will be logged out from all devices.',
    });
  } catch (err) {
    console.error('[POST /api/admin/change-password] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
