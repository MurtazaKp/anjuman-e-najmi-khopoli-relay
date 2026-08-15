import { NextResponse } from "next/server";
import { getActiveEvent, getFormattedRegistrationData } from "@/lib/events";
import { generateExcelBuffer, generateCSVString } from "@/lib/googlesheets";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel";

    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event found" }, { status: 404 });
    }

    const { eventName, familyGroups } = await getFormattedRegistrationData(event.id);

    if (format === "csv") {
      const csvContent = generateCSVString(eventName, familyGroups);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Khopoli_Relay_Centre_${event.slug}_Registrations.csv"`,
        },
      });
    }

    // Default to formatted Excel (.xlsx)
    const excelBuffer = generateExcelBuffer(eventName, familyGroups);
    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Khopoli_Relay_Centre_${event.slug}_Registrations.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("[Export Error]", error);
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
