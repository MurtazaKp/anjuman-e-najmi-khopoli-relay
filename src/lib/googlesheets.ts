import * as XLSX from 'xlsx';

export interface FormattedMemberRow {
  itsId: string;
  name: string;
  status: string; // "HOF" or "Family Member"
  gender: string; // "Male" or "Female"
  type: string;   // "Adult" or "Child"
  mobileNumber: string; // Mobile for HOF, "—" for members
}

export interface FormattedFamilyGroup {
  hofName: string;
  hofItsId: string;
  mobileNumber: string;
  mauze?: string;
  transportMode?: string;
  niyazJaman?: string;
  niyazContribution?: string;
  members: FormattedMemberRow[];
}

export function buildFormattedSheetRows(eventName: string, familyGroups: FormattedFamilyGroup[]): any[][] {
  const rows: any[][] = [];

  rows.push(["KHOPOLI RELAY CENTRE"]);
  rows.push([eventName]);
  rows.push([]);

  rows.push([
    "ITS ID",
    "Name",
    "Status",
    "Gender",
    "Type",
    "Mobile Number",
    "Mauze",
    "Transportation",
    "Niyaz Jaman",
    "Niyaz Contribution"
  ]);

  familyGroups.forEach((family, index) => {
    family.members.forEach((member, memberIdx) => {
      let contribVal: any = memberIdx === 0 ? family.niyazContribution || "—" : "—";
      if (contribVal !== "—" && contribVal !== "Je Imkaan Thase") {
        const num = Number(String(contribVal).replace(/,/g, "").trim());
        if (!isNaN(num)) contribVal = num;
      }

      rows.push([
        member.itsId,
        member.name,
        member.status,
        member.gender,
        member.type,
        member.mobileNumber,
        family.mauze || "—",
        family.transportMode || "—",
        family.niyazJaman || "—",
        contribVal
      ]);
    });

    if (index < familyGroups.length - 1) {
      rows.push([]);
    }
  });

  return rows;
}

export function generateExcelBuffer(eventName: string, familyGroups: FormattedFamilyGroup[]): Buffer {
  const rows = buildFormattedSheetRows(eventName, familyGroups);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 26 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCSVString(eventName: string, familyGroups: FormattedFamilyGroup[]): string {
  const rows = buildFormattedSheetRows(eventName, familyGroups);
  return rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(",")).join("\n");
}

/**
 * Live sync to Google Sheets Webhook (Apps Script / Google API)
 */
export async function syncToGoogleSheetWebhook(data: {
  eventName: string;
  family: FormattedFamilyGroup;
}) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes("placeholder")) {
    console.log("[Google Sheets Sync] Webhook URL not configured yet");
    return { success: true, synced: false, message: "Webhook URL not configured" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow',
    });

    if (res.ok) {
      return { success: true, synced: true };
    } else {
      console.error("[Google Sheets Sync] Webhook failed:", res.status, res.statusText);
      return {
        success: false,
        synced: false,
        error: res.status === 403
          ? "Google 403 Forbidden: In Google Apps Script, click Deploy > New Deployment (Version: New version, Who has access: Anyone) to grant access."
          : `${res.status} ${res.statusText}`,
      };
    }
  } catch (err: any) {
    console.error("[Google Sheets Sync] Error sending to webhook:", err.message);
    return { success: false, synced: false, error: err.message };
  }
}
