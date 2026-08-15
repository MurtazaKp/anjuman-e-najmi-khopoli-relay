import { NextResponse } from "next/server";
import { getActiveEvent, getFormattedRegistrationData } from "@/lib/events";
import { syncToGoogleSheetWebhook } from "@/lib/googlesheets";

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

    let syncedCount = 0;
    let lastError = null;

    for (const family of familyGroups) {
      const res = await syncToGoogleSheetWebhook({
        eventName,
        family,
      });

      if (res.synced) {
        syncedCount++;
      } else {
        lastError = res.error || res.message;
      }
    }

    if (syncedCount === 0 && lastError) {
      return NextResponse.json(
        {
          error: `Google Sheet Sync Failed: ${lastError}. Please verify GOOGLE_SHEET_WEBHOOK_URL in .env`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} family registrations to Google Sheet!`,
      syncedFamilies: syncedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
