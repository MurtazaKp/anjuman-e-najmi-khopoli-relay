import { NextResponse } from "next/server";
import { getActiveEvent, generatePassesForEvent } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event" }, { status: 404 });
    }

    if (event.status === "REGISTRATION_OPEN") {
      return NextResponse.json(
        { error: "Registration is currently OPEN. You must close registration first before generating passes." },
        { status: 400 }
      );
    }

    const result = await generatePassesForEvent(event.id);
    return NextResponse.json({
      success: true,
      message: `Generated digital passes for ${result.passesCreated} family members!`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
