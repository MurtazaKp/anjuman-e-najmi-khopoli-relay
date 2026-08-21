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

      const genderDisplay = member.type === "Child" || member.gender === "Child" || member.gender === "Gair Baligh"
        ? "Gair Baligh"
        : `${member.gender} Adult`;

      rows.push([
        member.itsId,
        member.name,
        member.status,
        genderDisplay,
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
    { wch: 16 },
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
 * Live bulk sync to Google Sheets Webhook (Clears duplicates and rewrites formatted sheet)
 */
export async function syncFullStoreToGoogleSheet(data: {
  eventName: string;
  familyGroups: FormattedFamilyGroup[];
}) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes("placeholder")) {
    console.log("[Google Sheets Sync] Webhook URL not configured yet");
    return { success: true, synced: false, message: "Webhook URL not configured" };
  }

  try {
    const formattedRows = buildFormattedSheetRows(data.eventName, data.familyGroups);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: "FULL_SYNC",
        eventName: data.eventName,
        familyGroups: data.familyGroups,
        rows: formattedRows,
      }),
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
      body: JSON.stringify({
        action: "SINGLE_FAMILY",
        eventName: data.eventName,
        family: data.family,
      }),
      redirect: 'follow',
    });

    if (res.ok) {
      return { success: true, synced: true };
    } else {
      console.error("[Google Sheets Sync] Webhook failed:", res.status, res.statusText);
      return { success: false, synced: false, error: `${res.status} ${res.statusText}` };
    }
  } catch (err: any) {
    console.error("[Google Sheets Sync] Error sending to webhook:", err.message);
    return { success: false, synced: false, error: err.message };
  }
}
