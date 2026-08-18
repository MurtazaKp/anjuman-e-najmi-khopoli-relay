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
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
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
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
