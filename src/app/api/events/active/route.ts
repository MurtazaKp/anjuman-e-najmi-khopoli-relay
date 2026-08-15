import { NextResponse } from "next/server";
import { getActiveEvent, updateEventStatus } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const event = await getActiveEvent();
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, status } = body;

    const event = await updateEventStatus(eventId, status);
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
