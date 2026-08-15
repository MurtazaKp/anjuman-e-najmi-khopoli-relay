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
  return getActiveEventData();
}

export async function checkDuplicateItsId(eventId: string, itsId: string) {
  return checkDuplicateItsIdData(eventId, itsId);
}

export async function registerFamily(eventId: string, input: RegisterFamilyInput) {
  return registerFamilyData(eventId, input);
}

export async function generatePassesForEvent(eventId: string) {
  return generatePassesData(eventId);
}

export async function getFamilyPasses(tokenOrIts: string) {
  return getFamilyPassesData(tokenOrIts);
}

export async function checkInPass(qrTokenOrIts: string) {
  return checkInPassData(qrTokenOrIts);
}

export async function getFormattedRegistrationData(eventId: string) {
  return getFormattedExportData(eventId);
}

export async function updateEventStatus(eventId: string, status: any) {
  const store = getStore();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");
  event.status = status;
  saveStore(store);
  return event;
}
