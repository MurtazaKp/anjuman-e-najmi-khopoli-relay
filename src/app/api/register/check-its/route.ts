import { NextResponse } from "next/server";
import { getActiveEvent, checkDuplicateItsId } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itsId = searchParams.get("itsId");

    if (!itsId) {
      return NextResponse.json({ isDuplicate: false });
    }

    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ isDuplicate: false });
    }

    const result = await checkDuplicateItsId(event.id, itsId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
