import { NextResponse } from "next/server";
import { getActiveEvent, generatePassesForEvent } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event" }, { status: 404 });
    }

    const result = await generatePassesForEvent(event.id);

    return NextResponse.json({
      success: true,
      message: result.passesCreated > 0 
        ? `Issued digital passes for ${result.passesCreated} new family members!` 
        : `All registered family members already have digital passes issued.`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
