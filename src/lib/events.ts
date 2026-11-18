import {
  getActiveEventData,
  checkDuplicateItsIdData,
  registerFamilyData,
  generatePassesData,
  getFamilyPassesData,
  checkInPassData,
  getFormattedExportData,
  getStore,
  saveStore,
  loadStoreFromSupabase,
  syncStoreToSupabase,
  invalidateSupabaseCache,
  lookupItsId,
  addMemberToFamily,
  removeMemberFromFamily,
  editMemberInFamily,
  mergeHofIntoFamily,
} from "./storage";

export interface RegisterMemberInput {
  itsId: string;
  name: string;
  gender: "Male" | "Female";
  type: "Adult" | "Child";
}

export interface RegisterFamilyInput {
  hofName: string;
  hofItsId: string;
  mobileNumber: string;
  hofGender: "Male" | "Female";
  hofType: "Adult" | "Child";
  familyMembers: RegisterMemberInput[];
}

export async function getActiveEvent() {
  await loadStoreFromSupabase();
  return getActiveEventData();
}

export async function checkDuplicateItsId(eventId: string, itsId: string) {
  const store = getStore();
  if (!store || store.families.length === 0) {
    await loadStoreFromSupabase();
  }
  return checkDuplicateItsIdData(eventId, itsId);
}

export async function registerFamily(eventId: string, input: RegisterFamilyInput) {
  const store = getStore();
  if (!store || store.families.length === 0) {
    await loadStoreFromSupabase();
  }
  const result = await registerFamilyData(eventId, input);
  invalidateSupabaseCache(); // bust cache so next read is fresh
  return result;
}

export async function generatePassesForEvent(eventId: string) {
  const store = await loadStoreFromSupabase();
  const res = generatePassesData(eventId, store || undefined);
  await syncStoreToSupabase(getStore());
  invalidateSupabaseCache(); // bust cache after pass generation
  return res;
}

export async function getFamilyPasses(tokenOrIts: string) {
  const store = await loadStoreFromSupabase();
  return getFamilyPassesData(tokenOrIts, store || undefined);
}

export async function checkInPass(qrTokenOrIts: string) {
  await loadStoreFromSupabase();
  const result = checkInPassData(qrTokenOrIts);
  invalidateSupabaseCache(); // bust cache after check-in
  return result;
}

export async function getFormattedRegistrationData(eventId: string) {
  await loadStoreFromSupabase();
  return getFormattedExportData(eventId);
}

export async function updateEventStatus(eventId: string, status: any) {
  await loadStoreFromSupabase();
  const store = getStore();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");
  event.status = status;
  saveStore(store);
  await syncStoreToSupabase(store);
  invalidateSupabaseCache(); // bust cache after status update
  return event;
}

// ─── Family Management (pre-pass-issue) ─────────────────────────────────────

export async function lookupItsIdInEvent(itsId: string) {
  await loadStoreFromSupabase();
  return lookupItsId(itsId);
}

export async function addFamilyMember(
  familyId: string,
  newMember: { itsId: string; name: string; gender: "Male" | "Female"; type: "Adult" | "Child" }
) {
  await loadStoreFromSupabase();
  const result = await addMemberToFamily(familyId, newMember);
  invalidateSupabaseCache();
  return result;
}

export async function removeFamilyMember(familyId: string, memberId: string) {
  await loadStoreFromSupabase();
  const result = await removeMemberFromFamily(familyId, memberId);
  invalidateSupabaseCache();
  return result;
}

export async function editFamilyMember(
  familyId: string,
  memberId: string,
  updates: { name?: string; gender?: "Male" | "Female"; type?: "Adult" | "Child" }
) {
  await loadStoreFromSupabase();
  const result = await editMemberInFamily(familyId, memberId, updates);
  invalidateSupabaseCache();
  return result;
}

export async function mergeHofFamily(targetFamilyId: string, sourceHofItsId: string) {
  await loadStoreFromSupabase();
  const result = await mergeHofIntoFamily(targetFamilyId, sourceHofItsId);
  invalidateSupabaseCache();
  return result;
}
