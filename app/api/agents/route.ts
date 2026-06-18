import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Agent from '@/models/Agent';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const agents = await Agent.find({}, { password: 0 }).sort({ createdAt: -1 });
    return NextResponse.json({ agents });
  } catch {
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const exists = await Agent.findOne({ username: username.toLowerCase().trim() });
    if (exists) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ username: username.toLowerCase().trim(), password: hashed });

    return NextResponse.json({ message: 'Agent created', username: agent.username }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/agents] Error:', err);
    const msg = err?.code === 11000
      ? 'Username already exists'
      : err?.message || 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
