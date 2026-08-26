import fs from "fs";
import path from "path";
import { FormattedFamilyGroup, syncToGoogleSheetWebhook, syncFullStoreToGoogleSheet } from "./googlesheets";
import { getSupabaseClient, isSupabaseConfigured, getSupabaseCredentials, supabaseRestFetch } from "./supabase";

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

let g_memoryStore: AppStore | null = null;

/**
 * Get current AppStore from memory cache or JSON file
 */
export function getStore(): AppStore {
  if (g_memoryStore) {
    return g_memoryStore;
  }

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
      g_memoryStore = initialStore;
      return initialStore;
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    g_memoryStore = JSON.parse(fileData) as AppStore;
    return g_memoryStore;
  } catch (err) {
    console.error("[Store Error] Failed to read store, fallback to default", err);
    g_memoryStore = {
      events: [DEFAULT_EVENT],
      families: [],
      passes: [],
    };
    return g_memoryStore;
  }
}

/**
 * Load store directly from Supabase PostgreSQL database
 */
export async function loadStoreFromSupabase(): Promise<AppStore | null> {
  const isConf = isSupabaseConfigured();
  const client = getSupabaseClient();
  const { url, key } = getSupabaseCredentials();

  if (!isConf || !client) return null;

  try {
    const [dbEvents, dbFamilies, dbMembers, dbPasses] = await Promise.all([
      supabaseRestFetch("events"),
      supabaseRestFetch("families"),
      supabaseRestFetch("members"),
      supabaseRestFetch("passes"),
    ]);

    if (!dbEvents || dbEvents.length === 0) return null;

    const events: EventData[] = dbEvents.map((e: any) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      date: e.date,
      time: e.time,
      venue: e.venue,
      location: e.location,
      mapUrl: e.map_url,
      parkingMapUrl: e.parking_map_url,
      latitude: e.latitude,
      longitude: e.longitude,
      registrationStart: e.registration_start,
      registrationEnd: e.registration_end,
      status: e.status,
      isCurrent: e.is_current,
      passIssueDate: e.pass_issue_date,
    }));

    const membersMap = new Map<string, FamilyMemberData[]>();
    (dbMembers || []).forEach((m: any) => {
      const list = membersMap.get(m.family_id) || [];
      list.push({
        id: m.id,
        familyId: m.family_id,
        eventId: m.event_id,
        itsId: m.its_id,
        name: m.name,
        gender: m.gender,
        type: m.type,
        isHof: m.is_hof,
        createdAt: m.created_at,
      });
      membersMap.set(m.family_id, list);
    });

    const families: FamilyData[] = (dbFamilies || []).map((f: any) => ({
      id: f.id,
      eventId: f.event_id,
      hofName: f.hof_name,
      hofItsId: f.hof_its_id,
      mobileNumber: f.mobile_number,
      mauze: f.mauze,
      transportMode: f.transport_mode,
      rajabRozaCount: f.rajab_roza_count,
      niyazJaman: f.niyaz_jaman,
      niyazContribution: f.niyaz_contribution,
      passLinkToken: f.pass_link_token,
      whatsappStatus: f.whatsapp_status,
      createdAt: f.created_at,
      members: membersMap.get(f.id) || [],
    }));

    const passes: PassData[] = (dbPasses || []).map((p: any) => ({
      id: p.id,
      familyId: p.family_id,
      eventId: p.event_id,
      memberId: p.member_id,
      passNumber: p.pass_number,
      qrToken: p.qr_token,
      status: p.status,
      checkedInAt: p.checked_in_at,
      checkedInBy: p.checked_in_by,
      createdAt: p.created_at,
    }));

    const store: AppStore = { events, families, passes };
    g_memoryStore = store;

    // Save cache locally
    try {
      const filePath = getStoreFilePath();
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
    } catch (e) {}

    return store;
  } catch (err) {
    console.error("[Supabase Load Error]", err);
    return null;
  }
}

/**
 * Clear all families, members, and passes from Supabase PostgreSQL
 */
export async function clearSupabaseStore() {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Delete all records from passes, members, and families
    await client.from("passes").delete().neq("id", "_none_");
    await client.from("members").delete().neq("id", "_none_");
    await client.from("families").delete().neq("id", "_none_");
  } catch (err) {
    console.error("[Supabase Clear Error]", err);
  }
}

/**
 * Sync store data asynchronously to Supabase PostgreSQL database
 */
export async function syncStoreToSupabase(store: AppStore) {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // 1. Sync Events
    if (store.events.length > 0) {
      const eventRows = store.events.map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        description: e.description,
        date: e.date,
        time: e.time,
        venue: e.venue,
        location: e.location,
        map_url: e.mapUrl,
        parking_map_url: (e as any).parkingMapUrl,
        latitude: e.latitude,
        longitude: e.longitude,
        registration_start: e.registrationStart,
        registration_end: e.registrationEnd,
        status: e.status,
        is_current: e.isCurrent,
        pass_issue_date: e.passIssueDate,
      }));
      await client.from("events").upsert(eventRows);
    }

    // 2. Sync Families & Members
    if (store.families.length > 0) {
      const familyRows = store.families.map((f) => ({
        id: f.id,
        event_id: f.eventId,
        hof_name: f.hofName,
        hof_its_id: f.hofItsId,
        mobile_number: f.mobileNumber,
        mauze: f.mauze,
        transport_mode: f.transportMode,
        rajab_roza_count: f.rajabRozaCount || 0,
        niyaz_jaman: f.niyazJaman,
        niyaz_contribution: f.niyazContribution,
        pass_link_token: f.passLinkToken,
        whatsapp_status: f.whatsappStatus,
        created_at: f.createdAt,
      }));
      await client.from("families").upsert(familyRows);

      const allMembers = store.families.flatMap((f) => f.members);
      if (allMembers.length > 0) {
        const memberRows = allMembers.map((m) => ({
          id: m.id,
          family_id: m.familyId,
          event_id: m.eventId,
          its_id: m.itsId,
          name: m.name,
          gender: m.gender,
          type: m.type,
          is_hof: m.isHof,
          created_at: m.createdAt,
        }));
        await client.from("members").upsert(memberRows);
      }
    }

    // 3. Sync Passes
    if (store.passes.length > 0) {
      const passRows = store.passes.map((p, idx) => {
        const matchingFamily = store.families.find((f) => f.members.some((m) => m.id === p.memberId));
        return {
          id: p.id,
          family_id: (p as any).familyId || matchingFamily?.id || null,
          event_id: p.eventId,
          member_id: p.memberId,
          pass_number: (p as any).passNumber || idx + 1,
          qr_token: p.qrToken,
          status: p.status,
          checked_in_at: p.checkedInAt || null,
          checked_in_by: p.checkedInBy || null,
          created_at: p.createdAt,
        };
      });
      const { error: passErr } = await client.from("passes").upsert(passRows);
      if (passErr) {
        console.error("[Supabase Pass Sync Error]", passErr.message);
      }
    }
  } catch (err) {
    console.error("[Supabase Sync Error]", err);
  }
}

/**
 * Save store to JSON file and background sync to Supabase when configured
 */
export function saveStore(store: AppStore) {
  g_memoryStore = store;
  try {
    const filePath = getStoreFilePath();
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");

    if (isSupabaseConfigured()) {
      syncStoreToSupabase(store).catch((e) => console.error("[Supabase Save Error]", e));
    }
  } catch (err) {
    console.error("[Store Error] Failed to save store", err);
  }
}

export const MAX_EVENT_CAPACITY = 1800;

/**
 * Calculate weighted seat count: Adult = 1.0, Child (Gair Baliqh) = 0.5
 */
export function calculateWeightedMemberCount(members: { type?: string }[]): number {
  return members.reduce((sum, m) => sum + (m.type === "Child" ? 0.5 : 1.0), 0);
}

/**
 * Get current active event with live capacity counts
 */
export function getActiveEventData(): EventData & { totalRegisteredMembers: number; weightedCapacityCount: number; totalFamilies: number; maxCapacity: number } {
  const store = getStore();
  const current = store.events.find((e) => e.isCurrent) || store.events[0];
  const activeEvent = current || DEFAULT_EVENT;

  const eventFamilies = store.families.filter((f) => !f.eventId || f.eventId === activeEvent.id);
  const totalRegisteredMembers = eventFamilies.reduce((acc, f) => acc + f.members.length, 0);
  const weightedCapacityCount = eventFamilies.reduce(
    (acc, f) => acc + calculateWeightedMemberCount(f.members),
    0
  );

  return {
    ...activeEvent,
    totalRegisteredMembers,
    weightedCapacityCount,
    totalFamilies: eventFamilies.length,
    maxCapacity: MAX_EVENT_CAPACITY,
  };
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

  // Check Weighted Capacity Limit before registration (Adult = 1.0, Child = 0.5)
  const currentWeightedCount = store.families
    .filter((f) => f.eventId === eventId)
    .reduce((acc, f) => acc + calculateWeightedMemberCount(f.members), 0);

  if (currentWeightedCount >= MAX_EVENT_CAPACITY) {
    event.status = "REGISTRATION_CLOSED";
    saveStore(store);
    throw new Error("Registration is officially CLOSED due to Capacity Full.");
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

  // Auto-close registration if weighted capacity reaches limit
  const newWeightedCount = currentWeightedCount + calculateWeightedMemberCount(allMembersInput);
  if (newWeightedCount >= MAX_EVENT_CAPACITY) {
    event.status = "REGISTRATION_CLOSED";
  }

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

  // Await both Supabase PostgreSQL sync and Google Sheets webhook sync in parallel (Required for Vercel Serverless environment)
  const syncPromises: Promise<any>[] = [];

  if (isSupabaseConfigured()) {
    syncPromises.push(syncStoreToSupabase(store));
  }

  syncPromises.push(
    syncToGoogleSheetWebhook({
      eventName: event.name,
      family: formattedGroup,
    })
  );

  await Promise.all(syncPromises).catch((err) => console.error("[Serverless Sync Error]", err));

  return newFamily;
}

/**
 * Generate passes for all members of an event
 */
export function generatePassesData(eventId: string, customStore?: AppStore) {
  const store = customStore || getStore();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");

  console.log("[generatePassesData Debug]", {
    eventId,
    eventFoundId: event.id,
    familiesCount: store.families.length,
    passesCount: store.passes.length,
    families: store.families.map((f) => ({
      id: f.id,
      eventId: f.eventId,
      membersCount: f.members.length,
      members: f.members.map((m) => ({ id: m.id, itsId: m.itsId })),
    })),
  });

  let passesCreated = 0;

  // Compute global sequential member order across all families for continuous token numbers
  const allMembersOrdered: FamilyMemberData[] = [];
  for (const family of store.families) {
    if (family.eventId === eventId) {
      for (const member of family.members) {
        allMembersOrdered.push(member);
      }
    }
  }

  const memberPassNumMap = new Map<string, number>();
  allMembersOrdered.forEach((m, idx) => {
    memberPassNumMap.set(m.id, idx + 1);
  });

  for (const family of store.families) {
    if (family.eventId === eventId) {
      for (const member of family.members) {
        const passNum = memberPassNumMap.get(member.id) || 1;
        const existingPass = store.passes.find((p) => p.memberId === member.id);
        if (!existingPass) {
          store.passes.push({
            id: `pass-${member.id}`,
            eventId,
            familyId: family.id,
            memberId: member.id,
            passNumber: passNum,
            qrToken: `KRC-${event.slug.toUpperCase()}-${member.itsId}`,
            status: "ISSUED",
            createdAt: new Date().toISOString(),
          } as any);
          passesCreated++;
        } else {
          (existingPass as any).passNumber = passNum;
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
 * Fetch family pass details by Pass Token, HOF ITS ID, Member ITS ID, or Mobile Number
 */
export function getFamilyPassesData(tokenOrIts: string, customStore?: AppStore) {
  const clean = tokenOrIts.trim();
  const cleanDigits = clean.replace(/\D/g, "");
  const store = customStore || getStore();

  console.log("[Debug Pass Lookup]", {
    clean,
    cleanDigits,
    familiesCount: store.families.length,
    families: store.families.map((f) => ({
      hofName: f.hofName,
      hofItsId: f.hofItsId,
      memberItsIds: f.members?.map((m) => m.itsId),
    })),
  });

  let family = store.families.find(
    (f) =>
      f.passLinkToken === clean ||
      f.hofItsId === clean ||
      (cleanDigits && f.hofItsId === cleanDigits) ||
      (cleanDigits && f.mobileNumber.replace(/\D/g, "") === cleanDigits) ||
      f.members.some(
        (m) => m.itsId === clean || (cleanDigits && m.itsId === cleanDigits)
      )
  );

  if (!family) return null;

  const event = store.events.find((e) => e.id === family.eventId);

  // Compute global sequential pass number for every member in store
  const allMembersOrdered: FamilyMemberData[] = [];
  for (const f of store.families) {
    if (f.eventId === family.eventId) {
      for (const m of f.members) {
        allMembersOrdered.push(m);
      }
    }
  }

  const passNumberMap = new Map<string, number>();
  allMembersOrdered.forEach((m, idx) => {
    passNumberMap.set(m.id, idx + 1);
  });

  const membersWithPasses = family.members.map((m) => {
    const pass = store.passes.find(
      (p) =>
        p.memberId === m.id ||
        (p as any).member_id === m.id ||
        (p as any).memberId === m.id ||
        p.qrToken?.includes(m.itsId)
    );
    const passNumber = passNumberMap.get(m.id) || 1;
    return {
      ...m,
      passNumber,
      pass: pass || null,
    };
  });

  const matchedMember = family.members.find(
    (m) => m.itsId === clean || (cleanDigits && m.itsId === cleanDigits)
  );

  return {
    ...family,
    event,
    members: membersWithPasses,
    matchedMemberId: matchedMember?.id || null,
  };
}

/**
 * Scan pass QR token or ITS ID for entrance check-in
 */
export function checkInPassData(qrTokenOrIts: string) {
  const clean = qrTokenOrIts.trim();
  const cleanDigits = clean.replace(/\D/g, "");
  const store = getStore();

  let pass: PassData | undefined;
  let member: FamilyMemberData | undefined;
  let family: FamilyData | undefined;

  // 1. Match by QR Token
  pass = store.passes.find(
    (p) =>
      p.qrToken === clean ||
      (cleanDigits && p.qrToken === `KRC-URS1448H-${cleanDigits}`)
  );

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
    // 2. Match by Member ITS ID directly
    for (const f of store.families) {
      const found = f.members.find(
        (m) => m.itsId === clean || (cleanDigits && m.itsId === cleanDigits)
      );
      if (found) {
        member = found;
        family = f;
        pass = store.passes.find((p) => p.memberId === member?.id);
        
        // Auto-generate pass if missing
        if (!pass) {
          pass = {
            id: `pass-${member.id}`,
            eventId: family.eventId,
            memberId: member.id,
            qrToken: `KRC-URS1448H-${member.itsId}`,
            status: "ISSUED",
            createdAt: new Date().toISOString(),
          };
          store.passes.push(pass);
        }
        break;
      }
    }
  }

  if (!member || !family || !pass) {
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

/**
 * Cancel/Delete an individual registration (or entire family) by member ITS ID
 */
export async function cancelMemberRegistration(
  itsId: string,
  options?: { cancelEntireFamily?: boolean }
) {
  const store = getStore();
  const cleanIts = itsId.trim();

  // Find family containing this ITS ID
  let targetFamilyIndex = -1;
  let targetMemberIndex = -1;

  for (let fIdx = 0; fIdx < store.families.length; fIdx++) {
    const mIdx = store.families[fIdx].members.findIndex(
      (m) => m.itsId.trim() === cleanIts
    );
    if (mIdx !== -1) {
      targetFamilyIndex = fIdx;
      targetMemberIndex = mIdx;
      break;
    }
  }

  if (targetFamilyIndex === -1) {
    throw new Error(`No registration found for ITS ID ${cleanIts}`);
  }

  const family = store.families[targetFamilyIndex];
  const member = family.members[targetMemberIndex];
  const isHof = member.isHof;

  // Case A: User selected to cancel entire family, or this member is the ONLY person in family
  if (options?.cancelEntireFamily || family.members.length === 1) {
    // Remove all passes for all family members
    const memberIds = new Set(family.members.map((m) => m.id));
    store.passes = store.passes.filter((p) => !memberIds.has(p.memberId));

    // Remove family
    const removedFamily = store.families.splice(targetFamilyIndex, 1)[0];

    saveStore(store);

    // Delete directly from Supabase PostgreSQL Database
    if (isSupabaseConfigured()) {
      const { url, key } = getSupabaseCredentials();
      const authHeaders = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      };
      await Promise.all([
        fetch(`${url}/rest/v1/passes?family_id=eq.${removedFamily.id}`, { method: "DELETE", headers: authHeaders }),
        fetch(`${url}/rest/v1/members?family_id=eq.${removedFamily.id}`, { method: "DELETE", headers: authHeaders }),
        fetch(`${url}/rest/v1/families?id=eq.${removedFamily.id}`, { method: "DELETE", headers: authHeaders }),
      ]).catch((e) => console.error("[Supabase Cancel Family Deletion Error]", e));
    }

    return {
      success: true,
      cancelledType: "ENTIRE_FAMILY",
      cancelledName: removedFamily.hofName,
      cancelledIts: removedFamily.hofItsId,
      message: `Cancelled entire family registration for ${removedFamily.hofName} (${removedFamily.members.length} members).`,
    };
  }

  // Case B: Single member cancellation (Multi-member family)
  if (isHof) {
    // Member is HOF: Promote next member to HOF
    family.members.splice(targetMemberIndex, 1);
    const newHof = family.members[0];
    newHof.isHof = true;
    family.hofName = newHof.name;
    family.hofItsId = newHof.itsId;

    // Remove cancelled HOF pass
    store.passes = store.passes.filter((p) => p.memberId !== member.id);
  } else {
    // Non-HOF member: Remove member
    family.members.splice(targetMemberIndex, 1);
    store.passes = store.passes.filter((p) => p.memberId !== member.id);
  }

  saveStore(store);

  // Delete/Update directly in Supabase PostgreSQL Database
  if (isSupabaseConfigured()) {
    const { url, key } = getSupabaseCredentials();
    const authHeaders = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };

    const reqs: Promise<any>[] = [
      fetch(`${url}/rest/v1/members?id=eq.${member.id}`, { method: "DELETE", headers: authHeaders }),
      fetch(`${url}/rest/v1/passes?member_id=eq.${member.id}`, { method: "DELETE", headers: authHeaders }),
    ];

    if (isHof && family.members.length > 0) {
      const newHof = family.members[0];
      reqs.push(
        fetch(`${url}/rest/v1/families?id=eq.${family.id}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            hof_name: family.hofName,
            hof_its_id: family.hofItsId,
          }),
        })
      );
      reqs.push(
        fetch(`${url}/rest/v1/members?id=eq.${newHof.id}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            is_hof: true,
          }),
        })
      );
    }

    await Promise.all(reqs).catch((e) => console.error("[Supabase Cancel Member Deletion Error]", e));
  }

  return {
    success: true,
    cancelledType: "SINGLE_MEMBER",
    cancelledName: member.name,
    cancelledIts: member.itsId,
    wasHof: isHof,
    newHofName: isHof ? family.hofName : undefined,
    message: `Cancelled registration for ${member.name} (ITS: ${member.itsId}).${
      isHof ? ` New HOF updated to ${family.hofName}.` : ""
    }`,
  };
}
