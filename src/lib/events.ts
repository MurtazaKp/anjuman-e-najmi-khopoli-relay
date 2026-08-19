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
  await loadStoreFromSupabase();
  return checkDuplicateItsIdData(eventId, itsId);
}

export async function registerFamily(eventId: string, input: RegisterFamilyInput) {
  await loadStoreFromSupabase();
  return registerFamilyData(eventId, input);
}

export async function generatePassesForEvent(eventId: string) {
  await loadStoreFromSupabase();
  const res = generatePassesData(eventId);
  await syncStoreToSupabase(getStore());
  return res;
}

export async function getFamilyPasses(tokenOrIts: string) {
  const store = await loadStoreFromSupabase();
  return getFamilyPassesData(tokenOrIts, store || undefined);
}

export async function checkInPass(qrTokenOrIts: string) {
  await loadStoreFromSupabase();
  return checkInPassData(qrTokenOrIts);
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
  return event;
}
