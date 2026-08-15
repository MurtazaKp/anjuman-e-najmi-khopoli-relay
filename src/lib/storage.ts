import fs from "fs";
import path from "path";
import { FormattedFamilyGroup, syncToGoogleSheetWebhook } from "./googlesheets";

export interface EventData {
  id: string;
  slug: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
  registrationStart: string;
  registrationEnd: string;
  passIssueDate?: string;
  status: "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "PASSES_ISSUED" | "COMPLETED";
  isCurrent: boolean;
}

export interface FamilyMemberData {
  id: string;
  familyId: string;
  eventId: string;
  itsId: string;
  name: string;
  gender: "Male" | "Female";
  type: "Adult" | "Child";
  isHof: boolean;
  createdAt: string;
}

export interface FamilyData {
  id: string;
  eventId: string;
  hofName: string;
  hofItsId: string;
  mobileNumber: string;
  mauze?: string;
  transportMode?: string;
  rajabRozaCount?: number;
  niyazJaman?: string;
  niyazContribution?: string;
  passLinkToken: string;
  whatsappStatus: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  createdAt: string;
  members: FamilyMemberData[];
}

export interface PassData {
  id: string;
  eventId: string;
  memberId: string;
  qrToken: string;
  status: "ISSUED" | "CHECKED_IN" | "CANCELLED";
  checkedInAt?: string;
  checkedInBy?: string;
  createdAt: string;
}

export interface AppStore {
  events: EventData[];
  families: FamilyData[];
  passes: PassData[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

// Default initial event
const DEFAULT_EVENT: EventData = {
  id: "event-urs-1448h",
  slug: "urs-1448h",
  name: "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H",
  description: "Urs Mubarak of Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. organized by Anjuman E Najmi Khopoli.",
  date: "16th Rabi al-Awwal 1448H",
  time: "9:00 AM Onwards",
  venue: "Maharaja Lawns - Khopoli",
  location: "L. M. Sable Nagar, Old Mumbai-Pune Highway, Dist. Khopoli, Maharashtra 410203",
  mapUrl: "https://maps.google.com/?q=Maharaja+Lawns+Khopoli",
  latitude: 18.7905,
  longitude: 73.3444,
  registrationStart: new Date().toISOString(),
  registrationEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: "REGISTRATION_OPEN",
  isCurrent: true,
};

// Initial sample family per PRD
const DEFAULT_SAMPLE_FAMILY: FamilyData = {
  id: "fam-sample-1",
  eventId: "event-urs-1448h",
  hofName: "Murtaza Khopoliwala",
  hofItsId: "12345678",
  mobileNumber: "9820098200",
  passLinkToken: "sample-pass-token-12345",
  whatsappStatus: "DELIVERED",
  createdAt: new Date().toISOString(),
  members: [
    {
      id: "mem-1",
      familyId: "fam-sample-1",
      eventId: "event-urs-1448h",
      itsId: "12345678",
      name: "Murtaza Khopoliwala",
      gender: "Male",
      type: "Adult",
      isHof: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mem-2",
      familyId: "fam-sample-1",
      eventId: "event-urs-1448h",
      itsId: "23456789",
      name: "Fatema Khopoliwala",
      gender: "Female",
      type: "Adult",
      isHof: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mem-3",
      familyId: "fam-sample-1",
      eventId: "event-urs-1448h",
      itsId: "34567890",
      name: "Ali Khopoliwala",
      gender: "Male",
      type: "Child",
      isHof: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mem-4",
      familyId: "fam-sample-1",
      eventId: "event-urs-1448h",
      itsId: "45678901",
      name: "Hussain Khopoliwala",
      gender: "Male",
      type: "Child",
      isHof: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

const DEFAULT_PASSES: PassData[] = DEFAULT_SAMPLE_FAMILY.members.map((m) => ({
  id: `pass-${m.id}`,
  eventId: "event-urs-1448h",
  memberId: m.id,
  qrToken: `KRC-URS1448H-${m.itsId}`,
  status: "ISSUED",
  createdAt: new Date().toISOString(),
}));

// Determine writable store file path (supports Vercel serverless /tmp directory)
const getStoreFilePath = (): string => {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join("/tmp", "store.json");
  }
  return STORE_FILE;
};

/**
 * Load store from JSON file or Vercel environment
 */
export function getStore(): AppStore {
  try {
    const filePath = getStoreFilePath();
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      const initialStore: AppStore = {
        events: [DEFAULT_EVENT],
        families: [],
        passes: [],
      };
      try {
        fs.writeFileSync(filePath, JSON.stringify(initialStore, null, 2), "utf-8");
      } catch (e) {
        // Ignore write error during initial read if read-only
      }
      return initialStore;
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileData) as AppStore;
  } catch (err) {
    console.error("[Store Error] Failed to read store, fallback to default", err);
    return {
      events: [DEFAULT_EVENT],
      families: [],
      passes: [],
    };
  }
}

/**
 * Save store to JSON file (supports Vercel serverless /tmp)
 */
export function saveStore(store: AppStore) {
  try {
    const filePath = getStoreFilePath();
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[Store Error] Failed to save store", err);
  }
}

/**
 * Get current active event
 */
export function getActiveEventData(): EventData {
  const store = getStore();
  const current = store.events.find((e) => e.isCurrent) || store.events[0];
  return current || DEFAULT_EVENT;
}

/**
 * Check if ITS ID is already registered for an event
 */
export function checkDuplicateItsIdData(eventId: string, itsId: string) {
  const cleanIts = itsId.trim();
  if (!cleanIts) return { isDuplicate: false };

  const store = getStore();
  for (const family of store.families) {
    if (family.eventId === eventId) {
      const foundMember = family.members.find((m) => m.itsId === cleanIts);
      if (foundMember) {
        return {
          isDuplicate: true,
          memberName: foundMember.name,
          registeredByHof: family.hofName,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Register new family & sync to Google Sheets
 */
export async function registerFamilyData(
  eventId: string,
  input: {
    hofName: string;
    hofItsId: string;
    mobileNumber: string;
    hofGender: "Male" | "Female";
    hofType: "Adult" | "Child";
    familyMembers: {
      itsId: string;
      name: string;
      gender: "Male" | "Female";
      type: "Adult" | "Child";
    }[];
  }
) {
  const store = getStore();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");

  if (event.status === "REGISTRATION_CLOSED" || event.status === "PASSES_ISSUED") {
    throw new Error("Registration for this event is closed.");
  }

  // Combine HOF + Family Members
  const allMembersInput = [
    {
      itsId: input.hofItsId.trim(),
      name: input.hofName.trim(),
      gender: input.hofGender,
      type: input.hofType,
      isHof: true,
    },
    ...input.familyMembers.map((m) => ({
      itsId: m.itsId.trim(),
      name: m.name.trim(),
      gender: m.gender,
      type: m.type,
      isHof: false,
    })),
  ];

  // 1. Check duplicate within submitted list
  const seenIts = new Set<string>();
  for (const m of allMembersInput) {
    if (seenIts.has(m.itsId)) {
      throw new Error(`Duplicate ITS ID ${m.itsId} found within input family list.`);
    }
    seenIts.add(m.itsId);
  }

  // 2. Check duplicate against existing registrations
  for (const m of allMembersInput) {
    const dup = checkDuplicateItsIdData(eventId, m.itsId);
    if (dup.isDuplicate) {
      throw new Error(`This ITS ID (${m.itsId}) is already registered for this event.`);
    }
  }

  const familyId = `fam-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const passLinkToken = `pass-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const createdMembers: FamilyMemberData[] = allMembersInput.map((m, idx) => ({
    id: `mem-${familyId}-${idx + 1}`,
    familyId,
    eventId,
    itsId: m.itsId,
    name: m.name,
    gender: m.gender,
    type: m.type,
    isHof: m.isHof,
    createdAt: new Date().toISOString(),
  }));

  const newFamily: FamilyData = {
    id: familyId,
    eventId,
    hofName: input.hofName.trim(),
    hofItsId: input.hofItsId.trim(),
    mobileNumber: input.mobileNumber.trim(),
    mauze: (input as any).mauze,
    transportMode: (input as any).transportMode,
    rajabRozaCount: (input as any).rajabRozaCount !== undefined ? Number((input as any).rajabRozaCount) : 0,
    niyazJaman: (input as any).niyazJaman,
    niyazContribution: (input as any).niyazContribution,
    passLinkToken,
    whatsappStatus: "PENDING",
    createdAt: new Date().toISOString(),
    members: createdMembers,
  };

  store.families.push(newFamily);
  saveStore(store);

  // Sync to Google Sheets
  const formattedGroup: FormattedFamilyGroup = {
    hofName: newFamily.hofName,
    hofItsId: newFamily.hofItsId,
    mobileNumber: newFamily.mobileNumber,
    mauze: newFamily.mauze,
    transportMode: newFamily.transportMode,
    niyazJaman: newFamily.niyazJaman,
    niyazContribution: newFamily.niyazContribution,
    members: createdMembers.map((m) => ({
      itsId: m.itsId,
      name: m.name,
      status: m.isHof ? "HOF" : "Family Member",
      gender: m.gender,
      type: m.type,
      mobileNumber: m.isHof ? newFamily.mobileNumber : "—",
    })),
  };

  await syncToGoogleSheetWebhook({
    eventName: event.name,
    family: formattedGroup,
  });

  return newFamily;
}

/**
 * Generate passes for all members of an event
 */
export function generatePassesData(eventId: string) {
  const store = getStore();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");

  let passesCreated = 0;

  for (const family of store.families) {
    if (family.eventId === eventId) {
      for (const member of family.members) {
        const existingPass = store.passes.find((p) => p.memberId === member.id);
        if (!existingPass) {
          store.passes.push({
            id: `pass-${member.id}`,
            eventId,
            memberId: member.id,
            qrToken: `KRC-${event.slug.toUpperCase()}-${member.itsId}`,
            status: "ISSUED",
            createdAt: new Date().toISOString(),
          });
          passesCreated++;
        }
      }
    }
  }

  event.status = "PASSES_ISSUED";
  event.passIssueDate = new Date().toISOString();

  saveStore(store);
  return { passesCreated };
}

/**
 * Get family passes by token or HOF ITS ID
 */
export function getFamilyPassesData(tokenOrIts: string) {
  const clean = tokenOrIts.trim();
  const store = getStore();

  const family = store.families.find(
    (f) => f.passLinkToken === clean || f.hofItsId === clean
  );

  if (!family) return null;

  const event = store.events.find((e) => e.id === family.eventId);

  const membersWithPasses = family.members.map((m) => {
    const pass = store.passes.find((p) => p.memberId === m.id);
    return {
      ...m,
      pass: pass || null,
    };
  });

  return {
    ...family,
    event,
    members: membersWithPasses,
  };
}

/**
 * Scan pass QR token or ITS ID for entrance check-in
 */
export function checkInPassData(qrTokenOrIts: string) {
  const clean = qrTokenOrIts.trim();
  const store = getStore();

  let pass = store.passes.find((p) => p.qrToken === clean);
  let member: FamilyMemberData | undefined;
  let family: FamilyData | undefined;

  if (pass) {
    for (const f of store.families) {
      const found = f.members.find((m) => m.id === pass?.memberId);
      if (found) {
        member = found;
        family = f;
        break;
      }
    }
  } else {
    // Check by member ITS ID
    for (const f of store.families) {
      const found = f.members.find((m) => m.itsId === clean);
      if (found) {
        member = found;
        family = f;
        pass = store.passes.find((p) => p.memberId === member?.id);
        if (!pass) {
          throw new Error("Digital pass has not been issued yet by event administration.");
        }
        break;
      }
    }
  }

  if (!pass || !member || !family) {
    return {
      status: "INVALID",
      message: "Pass not found. Invalid QR token or ITS ID.",
    };
  }

  const event = store.events.find((e) => e.id === pass?.eventId);

  if (pass.status === "CHECKED_IN") {
    return {
      status: "ALREADY_CHECKED_IN",
      message: "⚠️ Already Checked In",
      pass,
      checkedInAt: pass.checkedInAt,
      member: {
        ...member,
        family,
      },
      event,
    };
  }

  // Update check-in status
  pass.status = "CHECKED_IN";
  pass.checkedInAt = new Date().toISOString();
  pass.checkedInBy = "Staff Scanner";

  saveStore(store);

  return {
    status: "VALID",
    message: "✅ VALID PASS",
    pass,
    checkedInAt: pass.checkedInAt,
    member: {
      ...member,
      family,
    },
    event,
  };
}

/**
 * Get formatted family groups for Google Sheets & Excel Export
 */
export function getFormattedExportData(eventId: string) {
  const store = getStore();
  const event = store.events.find((e) => e.id === eventId) || store.events[0];

  const families = store.families.filter((f) => f.eventId === event.id);

  const familyGroups: FormattedFamilyGroup[] = families.map((fam) => ({
    hofName: fam.hofName,
    hofItsId: fam.hofItsId,
    mobileNumber: fam.mobileNumber,
    mauze: fam.mauze,
    transportMode: fam.transportMode,
    niyazJaman: fam.niyazJaman,
    niyazContribution: fam.niyazContribution,
    members: fam.members.map((m) => ({
      itsId: m.itsId,
      name: m.name,
      status: m.isHof ? "HOF" : "Family Member",
      gender: m.gender,
      type: m.type,
      mobileNumber: m.isHof ? fam.mobileNumber : "—",
    })),
  }));

  return {
    eventName: event.name,
    familyGroups,
  };
}
