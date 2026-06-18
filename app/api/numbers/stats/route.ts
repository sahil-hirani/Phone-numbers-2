import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const total = await PhoneNumber.countDocuments();
    const pending = await PhoneNumber.countDocuments({ status: 'pending' });
    const connected = await PhoneNumber.countDocuments({ status: 'connected' });
    const not_connected = await PhoneNumber.countDocuments({ status: 'not_connected' });
    const whatsapp = await PhoneNumber.countDocuments({ whatsappDone: true });
    return NextResponse.json({ total, pending, connected, not_connected, whatsapp });
  } catch {
    return NextResponse.json({ total: 0, pending: 0, connected: 0, not_connected: 0, whatsapp: 0 }, { status: 500 });
  }
}
