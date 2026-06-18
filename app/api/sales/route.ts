import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhoneNumber from '@/models/PhoneNumber';
import SaleEntry from '@/models/SaleEntry';
import Agent from '@/models/Agent';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { clientId, number, agentUsername } = await req.json();

    if (!clientId || !String(clientId).trim()) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const trimmedClientId = String(clientId).trim().toLowerCase();

    const existing = await SaleEntry.findOne({ clientId: trimmedClientId });
    if (existing) {
      const updated = await SaleEntry.findOneAndUpdate(
        { clientId: trimmedClientId },
        { lastActivityDate: new Date(), $inc: { activityCount: 1 } },
        { new: true }
      );
      return NextResponse.json({
        success: true,
        returning: true,
        message: 'Sale recorded for returning client',
        agent: existing.assignedTo,
        number: existing.number,
        activityCount: updated!.activityCount,
      });
    }

    if (!number || !String(number).trim()) {
      return NextResponse.json({ needsNumber: true });
    }

    const trimmedNumber = String(number).trim();

    const phoneRecord = await PhoneNumber.findOne({ number: trimmedNumber });
    if (phoneRecord) {
      await SaleEntry.create({
        clientId: trimmedClientId,
        number: trimmedNumber,
        assignedTo: phoneRecord.assignedTo ?? undefined,
        lastActivityDate: new Date(),
        activityCount: 1,
      });
      return NextResponse.json({
        success: true,
        returning: false,
        message: 'New client registered',
        agent: phoneRecord.assignedTo,
        number: trimmedNumber,
        activityCount: 1,
      });
    }

    if (!agentUsername || !String(agentUsername).trim()) {
      const agents = await Agent.find({}, { username: 1 }).lean();
      return NextResponse.json({
        needsAgent: true,
        agents: agents.map((a) => a.username),
      });
    }

    const trimmedAgent = String(agentUsername).trim();
    await PhoneNumber.create({
      number: trimmedNumber,
      assignedTo: trimmedAgent,
      status: 'pending',
      uploadBatch: `manual_sale_${Date.now()}`,
    });
    await SaleEntry.create({
      clientId: trimmedClientId,
      number: trimmedNumber,
      assignedTo: trimmedAgent,
      lastActivityDate: new Date(),
      activityCount: 1,
    });
    return NextResponse.json({
      success: true,
      returning: false,
      message: 'New client registered with new number assigned to agent',
      agent: trimmedAgent,
      number: trimmedNumber,
      activityCount: 1,
    });
  } catch (err: any) {
    console.error('[POST /api/sales]', err);
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'This number is already linked to another client.' }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const entries = await SaleEntry.find({}).sort({ lastActivityDate: -1 }).lean();
    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error('[GET /api/sales]', err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
