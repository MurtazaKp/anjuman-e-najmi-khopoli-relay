import { NextResponse } from "next/server";
import { getActiveEvent, getFormattedRegistrationData } from "@/lib/events";
import { syncFullStoreToGoogleSheet } from "@/lib/googlesheets";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event" }, { status: 404 });
    }

    const { eventName, familyGroups } = await getFormattedRegistrationData(event.id);

    if (familyGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No registrations found to sync.",
        syncedFamilies: 0,
      });
    }

    const res = await syncFullStoreToGoogleSheet({
      eventName,
      familyGroups,
    });

    if (!res.synced) {
      return NextResponse.json(
        {
          error: `Google Sheet Sync Failed: ${res.error || res.message}. Please verify GOOGLE_SHEET_WEBHOOK_URL in .env`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${familyGroups.length} family registrations to Google Sheet cleanly with zero duplicates!`,
      syncedFamilies: familyGroups.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
