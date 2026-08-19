import { NextResponse } from "next/server";
import { getActiveEvent, updateEventStatus } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const event = await getActiveEvent();
    return NextResponse.json(
      { success: true, event },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, status } = body;

    await updateEventStatus(eventId, status);
    const event = await getActiveEvent();
    return NextResponse.json(
      { success: true, event },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
