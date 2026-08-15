import { NextResponse } from "next/server";
import { checkInPass } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { qrToken } = body;

    if (!qrToken) {
      return NextResponse.json({ error: "QR Token or ITS ID is required" }, { status: 400 });
    }

    const result = await checkInPass(qrToken);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Check-in failed" }, { status: 500 });
  }
}
