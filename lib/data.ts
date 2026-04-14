import { ObjectId } from "mongodb";
import { unstable_noStore as noStore } from "next/cache";

import { canAttemptMongo, getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { mockApplications, mockArchive, mockDjRoster, mockEvents, mockLocations, mockTags } from "@/lib/mock-data";
import { ApplicationRecord, ArchiveRecord, ContactSubmissionRecord, DjRosterRecord, EventRecord, LocationRecord, TagRecord } from "@/lib/types";

type NewApplication = Omit<ApplicationRecord, "id" | "submittedAt" | "status">;
type NewContactSubmission = Omit<ContactSubmissionRecord, "id" | "submittedAt">;
type NewEvent = Omit<EventRecord, "id" | "status">;
type UpdateEventInput = Partial<Omit<EventRecord, "id">>;
type NewArchiveEntry = Omit<ArchiveRecord, "id">;
type UpdateArchiveEntry = Partial<NewArchiveEntry>;
type UpdateApplicationInput = Partial<Pick<ApplicationRecord, "status">>;
type NewDjRosterEntry = Omit<
  DjRosterRecord,
  | "id"
  | "approvedAt"
  | "membershipCardEnabled"
  | "membershipCardId"
  | "membershipCardIssuedAt"
  | "membershipCardEmailSentAt"
>;
type UpdateDjRosterMembershipInput = {
  membershipCardEnabled: boolean;
  membershipCardId?: string;
  membershipCardIssuedAt?: string;
  membershipCardEmailSentAt?: string;
};
type NewTag = Omit<TagRecord, "id">;
type NewLocation = Omit<LocationRecord, "id">;
type UpdateLocationInput = Partial<NewLocation>;
const mockContactSubmissions: ContactSubmissionRecord[] = [];

function sortEvents(events: EventRecord[]) {
  return [...events].sort(
    (a, b) => getEventTimestamp(b.date, b.time) - getEventTimestamp(a.date, a.time)
  );
}

function applyEventDerivedState(event: EventRecord): EventRecord {
  const status = getEventStatusFromDate(event.date, event.time);

  return {
    ...event,
    status,
    applicationsOpen: status === "upcoming" ? Boolean(event.applicationsOpen) : false
  };
}

async function withMongoFallback<T>(query: () => Promise<T>, fallback: () => T | Promise<T>) {
  if (!canAttemptMongo()) {
    return fallback();
  }

  try {
    return await query();
  } catch {
    return fallback();
  }
}

export async function getEvents() {
  noStore();

  if (!isMongoConfigured()) {
    return sortEvents(mockEvents);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const events = await db.collection<EventRecord>("events").find({}).toArray();
      return sortEvents(events.map(normalizeEvent));
    },
    () => sortEvents(mockEvents)
  );
}

export async function getEventBySlug(slug: string) {
  noStore();

  const events = await getEvents();
  const decodedSlug = safeDecodeURIComponent(slug);
  const normalizedSlug = normalizeSlugValue(decodedSlug);

  return (
    events.find((event) => {
      const eventSlug = normalizeSlugValue(event.slug);
      const eventTitleSlug = normalizeSlugValue(event.title);

      return (
        event.slug === slug ||
        event.slug === decodedSlug ||
        eventSlug === normalizedSlug ||
        eventTitleSlug === normalizedSlug
      );
    }) || null
  );
}

export async function getUpcomingEvent() {
  noStore();

  const events = await getEvents();
  const upcomingEvents = events
    .filter((event) => getEventStatusFromDate(event.date, event.time) === "upcoming")
    .sort((a, b) => getEventTimestamp(a.date, a.time) - getEventTimestamp(b.date, b.time));

  return upcomingEvents[0] || null;
}

export async function getArchiveEntries() {
  noStore();

  if (!isMongoConfigured()) {
    return [...mockArchive].sort((a, b) => a.order - b.order);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const archive = await db
        .collection<ArchiveRecord>("archive")
        .find({})
        .sort({ order: 1, year: -1 })
        .toArray();

      return archive.map(normalizeArchive);
    },
    () => [...mockArchive].sort((a, b) => a.order - b.order)
  );
}

export async function getApplications() {
  noStore();

  if (!isMongoConfigured()) {
    return [...mockApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const applications = await db
        .collection<ApplicationRecord>("applications")
        .find({})
        .sort({ submittedAt: -1 })
        .toArray();

      return applications.map(normalizeApplication);
    },
    () => [...mockApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  );
}

export async function getDjRosterEntries() {
  noStore();

  if (!isMongoConfigured()) {
    return [...mockDjRoster];
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const roster = await db
        .collection<DjRosterRecord>("dj_roster")
        .find({})
        .sort({ approvedAt: -1 })
        .toArray();

      return roster.map(normalizeDjRoster);
    },
    () => [...mockDjRoster]
  );
}

export async function getTags() {
  noStore();

  if (!isMongoConfigured()) {
    return [...mockTags].sort((a, b) => a.label.localeCompare(b.label, "it"));
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const tags = await db.collection<TagRecord>("tags").find({}).sort({ label: 1 }).toArray();
      return tags.map(normalizeTag);
    },
    () => [...mockTags].sort((a, b) => a.label.localeCompare(b.label, "it"))
  );
}

export async function getLocations() {
  noStore();

  if (!isMongoConfigured()) {
    return [...mockLocations].sort((a, b) => a.name.localeCompare(b.name, "it"));
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const locations = await db.collection<LocationRecord>("locations").find({}).sort({ name: 1 }).toArray();
      return locations.map(normalizeLocation);
    },
    () => [...mockLocations].sort((a, b) => a.name.localeCompare(b.name, "it"))
  );
}

export async function getLocationById(id: string) {
  noStore();

  const locations = await getLocations();
  return locations.find((location) => location.id === id) || null;
}

export async function createTag(input: NewTag) {
  if (!isMongoConfigured()) {
    return createTagMock(input);
  }

  const db = await getDatabase();
  const existing = await db.collection<TagRecord>("tags").findOne({ slug: input.slug });

  if (existing) {
    return normalizeTag(existing);
  }

  const record: TagRecord = {
    id: new ObjectId().toHexString(),
    ...input
  };

  await db.collection<TagRecord>("tags").insertOne(record);
  return record;
}

export async function createLocation(input: NewLocation) {
  if (!isMongoConfigured()) {
    return createLocationMock(input);
  }

  const db = await getDatabase();
  const record: LocationRecord = {
    id: new ObjectId().toHexString(),
    ...input
  };

  await db.collection<LocationRecord>("locations").insertOne(record);
  return record;
}

export async function updateLocation(id: string, input: UpdateLocationInput) {
  if (!isMongoConfigured()) {
    return updateLocationMock(id, input);
  }

  const db = await getDatabase();
  await db.collection<LocationRecord>("locations").updateOne({ id }, { $set: input });
  const updated = await db.collection<LocationRecord>("locations").findOne({ id });

  if (!updated) {
    return null;
  }

  const normalizedLocation = normalizeLocation(updated);

  await db.collection<EventRecord>("events").updateMany(
    { locationId: id },
    {
      $set: {
        locationName: normalizedLocation.name,
        locationAddress: normalizedLocation.address
      }
    }
  );

  return normalizedLocation;
}

export async function deleteLocation(id: string) {
  if (!isMongoConfigured()) {
    return deleteLocationMock(id);
  }

  const db = await getDatabase();
  const linkedEvents = await db.collection<EventRecord>("events").countDocuments({ locationId: id });

  if (linkedEvents > 0) {
    return { deleted: false, blocked: true };
  }

  const result = await db.collection<LocationRecord>("locations").deleteOne({ id });
  return { deleted: Boolean(result.deletedCount), blocked: false };
}

export async function updateDjRosterMembership(
  id: string,
  input: UpdateDjRosterMembershipInput
) {
  if (!isMongoConfigured()) {
    return updateDjRosterMembershipMock(id, input);
  }

  const db = await getDatabase();
  await db.collection<DjRosterRecord>("dj_roster").updateOne({ id }, { $set: input });
  const updated = await db.collection<DjRosterRecord>("dj_roster").findOne({ id });
  return updated ? normalizeDjRoster(updated) : null;
}

export async function createDjRosterEntry(input: NewDjRosterEntry) {
  const record: DjRosterRecord = {
    id: new ObjectId().toHexString(),
    approvedAt: new Date().toISOString(),
    membershipCardEnabled: false,
    ...input
  };

  if (!isMongoConfigured()) {
    mockDjRoster.unshift(record);
    return record;
  }

  const db = await getDatabase();
  await db.collection<DjRosterRecord>("dj_roster").insertOne(record);
  return record;
}

export async function createApplication(input: NewApplication) {
  const record: ApplicationRecord = {
    id: new ObjectId().toHexString(),
    submittedAt: new Date().toISOString(),
    status: "new",
    ...input
  };

  if (!isMongoConfigured()) {
    mockApplications.unshift(record);
    return record;
  }

  const db = await getDatabase();
  await db.collection<ApplicationRecord>("applications").insertOne(record);
  return record;
}

export async function createContactSubmission(input: NewContactSubmission) {
  const record: ContactSubmissionRecord = {
    id: new ObjectId().toHexString(),
    submittedAt: new Date().toISOString(),
    ...input
  };

  if (!isMongoConfigured()) {
    mockContactSubmissions.unshift(record);
    return record;
  }

  const db = await getDatabase();
  await db.collection<ContactSubmissionRecord>("contact_submissions").insertOne(record);
  return record;
}

export async function updateApplication(id: string, input: UpdateApplicationInput) {
  if (!isMongoConfigured()) {
    return updateApplicationMock(id, input);
  }

  const db = await getDatabase();
  await db.collection<ApplicationRecord>("applications").updateOne({ id }, { $set: input });
  const updated = await db.collection<ApplicationRecord>("applications").findOne({ id });

  if (!updated) {
    return null;
  }

  const normalized = normalizeApplication(updated);
  await syncDjRosterForApplication(db, normalized);
  return normalized;
}

export async function deleteApplication(id: string) {
  if (!isMongoConfigured()) {
    return deleteApplicationMock(id);
  }

  const db = await getDatabase();
  const result = await db.collection<ApplicationRecord>("applications").deleteOne({ id });
  return Boolean(result.deletedCount);
}

export async function createEvent(input: NewEvent) {
  if (!isMongoConfigured()) {
    const record: EventRecord = {
      id: new ObjectId().toHexString(),
      status: getEventStatusFromDate(input.date, input.time),
      ...input
    };
    const nextRecord = applyEventDerivedState(record);
    mockEvents.push(nextRecord);
    return sortEvents(mockEvents).find((event) => event.id === nextRecord.id) || nextRecord;
  }

  const db = await getDatabase();
  const record: EventRecord = {
    id: new ObjectId().toHexString(),
    status: getEventStatusFromDate(input.date, input.time),
    ...input
  };
  const nextRecord = applyEventDerivedState(record);
  await db.collection<EventRecord>("events").insertOne(nextRecord);
  return nextRecord;
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  if (!isMongoConfigured()) {
    return updateEventMock(id, input);
  }

  const db = await getDatabase();
  const current = await db.collection<EventRecord>("events").findOne({ id });

  if (!current) {
    return null;
  }

  const nextInput = {
    ...input,
    status:
      input.date || input.time
        ? getEventStatusFromDate(input.date || current.date, input.time || current.time)
        : current.status
  };

  const targetStatus =
    nextInput.status || getEventStatusFromDate(input.date || current.date, input.time || current.time);

  if (targetStatus === "past") {
    nextInput.applicationsOpen = false;
  }

  await db.collection<EventRecord>("events").updateOne({ id }, { $set: nextInput });
  const updated = await db.collection<EventRecord>("events").findOne({ id });
  return updated ? normalizeEvent(updated) : null;
}

export async function deleteEvent(id: string) {
  if (!isMongoConfigured()) {
    return deleteEventMock(id);
  }

  const db = await getDatabase();
  const eventDeleteResult = await db.collection<EventRecord>("events").deleteOne({ id });

  if (!eventDeleteResult.deletedCount) {
    return false;
  }

  await db.collection<ApplicationRecord>("applications").deleteMany({ eventId: id });

  return true;
}

export async function createArchiveEntry(input: NewArchiveEntry) {
  const record: ArchiveRecord = {
    id: new ObjectId().toHexString(),
    ...input
  };

  if (!isMongoConfigured()) {
    mockArchive.push(record);
    mockArchive.sort((a, b) => a.order - b.order);
    return record;
  }

  const db = await getDatabase();
  await db.collection<ArchiveRecord>("archive").insertOne(record);
  return record;
}

export async function updateArchiveEntry(id: string, input: UpdateArchiveEntry) {
  if (!isMongoConfigured()) {
    return updateArchiveMock(id, input);
  }

  const db = await getDatabase();
  await db.collection<ArchiveRecord>("archive").updateOne({ id }, { $set: input });
  const updated = await db.collection<ArchiveRecord>("archive").findOne({ id });
  return updated ? normalizeArchive(updated) : null;
}

export async function deleteArchiveEntry(id: string) {
  if (!isMongoConfigured()) {
    return deleteArchiveMock(id);
  }

  const db = await getDatabase();
  const result = await db.collection<ArchiveRecord>("archive").deleteOne({ id });
  return Boolean(result.deletedCount);
}

function updateArchiveMock(id: string, input: UpdateArchiveEntry) {
  const index = mockArchive.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockArchive[index] = {
    ...mockArchive[index],
    ...input
  };

  mockArchive.sort((a, b) => a.order - b.order);
  return mockArchive[index];
}

function deleteArchiveMock(id: string) {
  const index = mockArchive.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  mockArchive.splice(index, 1);
  return true;
}

function updateEventMock(id: string, input: UpdateEventInput) {
  const index = mockEvents.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockEvents[index] = {
    ...mockEvents[index],
    ...input,
    status:
      input.date || input.time
        ? getEventStatusFromDate(input.date || mockEvents[index].date, input.time || mockEvents[index].time)
        : mockEvents[index].status
  };

  mockEvents[index] = applyEventDerivedState(mockEvents[index]);

  return mockEvents[index];
}

function updateApplicationMock(id: string, input: UpdateApplicationInput) {
  const index = mockApplications.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockApplications[index] = {
    ...mockApplications[index],
    ...input
  };

  syncDjRosterMock(mockApplications[index]);
  return mockApplications[index];
}

function deleteApplicationMock(id: string) {
  const index = mockApplications.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  mockApplications.splice(index, 1);

  return true;
}

function deleteEventMock(id: string) {
  const index = mockEvents.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  mockEvents.splice(index, 1);

  for (let cursor = mockApplications.length - 1; cursor >= 0; cursor -= 1) {
    if (mockApplications[cursor].eventId === id) {
      mockApplications.splice(cursor, 1);
    }
  }

  return true;
}

function updateDjRosterMembershipMock(id: string, input: UpdateDjRosterMembershipInput) {
  const index = mockDjRoster.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockDjRoster[index] = {
    ...mockDjRoster[index],
    ...input
  };

  return mockDjRoster[index];
}

function createTagMock(input: NewTag) {
  const existing = mockTags.find((item) => item.slug === input.slug);

  if (existing) {
    return existing;
  }

  const record: TagRecord = {
    id: new ObjectId().toHexString(),
    ...input
  };

  mockTags.push(record);
  mockTags.sort((a, b) => a.label.localeCompare(b.label, "it"));
  return record;
}

function createLocationMock(input: NewLocation) {
  const record: LocationRecord = {
    id: new ObjectId().toHexString(),
    ...input
  };

  mockLocations.push(record);
  mockLocations.sort((a, b) => a.name.localeCompare(b.name, "it"));
  return record;
}

function updateLocationMock(id: string, input: UpdateLocationInput) {
  const index = mockLocations.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockLocations[index] = normalizeLocation({
    ...mockLocations[index],
    ...input
  });

  mockEvents.forEach((event, eventIndex) => {
    if (event.locationId !== id) {
      return;
    }

    mockEvents[eventIndex] = {
      ...event,
      locationName: mockLocations[index].name,
      locationAddress: mockLocations[index].address
    };
  });

  mockLocations.sort((a, b) => a.name.localeCompare(b.name, "it"));

  return mockLocations.find((item) => item.id === id) || null;
}

function deleteLocationMock(id: string) {
  const linkedEvents = mockEvents.filter((event) => event.locationId === id).length;

  if (linkedEvents > 0) {
    return { deleted: false, blocked: true };
  }

  const index = mockLocations.findIndex((item) => item.id === id);

  if (index === -1) {
    return { deleted: false, blocked: false };
  }

  mockLocations.splice(index, 1);
  return { deleted: true, blocked: false };
}

function normalizeEvent(record: EventRecord & { _id?: ObjectId }) {
  const { _id, ...event } = record;

  return {
    ...applyEventDerivedState(event),
    lineupPublished: Boolean(event.lineupPublished),
    lineupDjIds: event.lineupDjIds || [],
    tagIds: event.tagIds || [],
    id: event.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function getEventStatusFromDate(date: string, time?: string): EventRecord["status"] {
  return getEventTimestamp(date, time) >= Date.now() ? "upcoming" : "past";
}

function getEventTimestamp(date: string, time?: string) {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time || "") ? `${time}:00` : "23:59:59";
  return new Date(`${date}T${normalizedTime}`).getTime();
}

function normalizeApplication(record: ApplicationRecord & { _id?: ObjectId }) {
  const { _id, ...application } = record;

  return {
    ...application,
    province: application.province || "",
    region: application.region || "",
    email: application.email || "",
    phone: application.phone || "",
    photoUrl: application.photoUrl || "",
    privacyPolicyVersion: application.privacyPolicyVersion || "",
    privacyAcceptedAt: application.privacyAcceptedAt || "",
    id: application.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeArchive(record: ArchiveRecord & { _id?: ObjectId }) {
  const { _id, ...archive } = record;

  return {
    ...archive,
    id: archive.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeDjRoster(record: DjRosterRecord & { _id?: ObjectId }) {
  const { _id, ...roster } = record;

  return {
    ...roster,
    sourceApplicationEventId: roster.sourceApplicationEventId || "",
    sourceApplicationEventTitle: roster.sourceApplicationEventTitle || "",
    province: roster.province || "",
    region: roster.region || "",
    email: roster.email || "",
    phone: roster.phone || "",
    photoUrl: roster.photoUrl || "",
    membershipCardEnabled: Boolean(roster.membershipCardEnabled),
    id: roster.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeTag(record: TagRecord & { _id?: ObjectId }) {
  const { _id, ...tag } = record;

  return {
    ...tag,
    id: tag.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeLocation(record: LocationRecord & { _id?: ObjectId }) {
  const { _id, ...location } = record;

  return {
    ...location,
    socialLink: location.socialLink || "",
    phone: location.phone || "",
    description: location.description || "",
    id: location.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeSlugValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function syncDjRosterForApplication(
  db: Awaited<ReturnType<typeof getDatabase>>,
  application: ApplicationRecord
) {
  if (application.status === "selected") {
    const existingRosterRecord = await db
      .collection<DjRosterRecord>("dj_roster")
      .findOne({ applicationId: application.id });
    const rosterRecord: DjRosterRecord = {
      id: application.id,
      applicationId: application.id,
      sourceApplicationEventId: application.eventId,
      sourceApplicationEventTitle: application.eventTitle,
      name: application.name,
      city: application.city,
      province: application.province || "",
      region: application.region || "",
      email: application.email,
      phone: application.phone,
      photoUrl: application.photoUrl,
      instagram: application.instagram,
      setLink: application.setLink,
      bio: application.bio,
      approvedAt: existingRosterRecord?.approvedAt || new Date().toISOString(),
      membershipCardEnabled: existingRosterRecord?.membershipCardEnabled || false,
      membershipCardId: existingRosterRecord?.membershipCardId,
      membershipCardIssuedAt: existingRosterRecord?.membershipCardIssuedAt,
      membershipCardEmailSentAt: existingRosterRecord?.membershipCardEmailSentAt
    };

    await db
      .collection<DjRosterRecord>("dj_roster")
      .updateOne({ applicationId: application.id }, { $set: rosterRecord }, { upsert: true });
  }
}

function syncDjRosterMock(application: ApplicationRecord) {
  const existingIndex = mockDjRoster.findIndex((item) => item.applicationId === application.id);
  const existingRosterRecord = existingIndex === -1 ? null : mockDjRoster[existingIndex];

  if (application.status === "selected") {
    const rosterRecord: DjRosterRecord = {
      id: application.id,
      applicationId: application.id,
      sourceApplicationEventId: application.eventId,
      sourceApplicationEventTitle: application.eventTitle,
      name: application.name,
      city: application.city,
      province: application.province || "",
      region: application.region || "",
      email: application.email,
      phone: application.phone,
      photoUrl: application.photoUrl,
      instagram: application.instagram,
      setLink: application.setLink,
      bio: application.bio,
      approvedAt: existingRosterRecord?.approvedAt || new Date().toISOString(),
      membershipCardEnabled: existingRosterRecord?.membershipCardEnabled || false,
      membershipCardId: existingRosterRecord?.membershipCardId,
      membershipCardIssuedAt: existingRosterRecord?.membershipCardIssuedAt,
      membershipCardEmailSentAt: existingRosterRecord?.membershipCardEmailSentAt
    };

    if (existingIndex === -1) {
      mockDjRoster.unshift(rosterRecord);
    } else {
      mockDjRoster[existingIndex] = rosterRecord;
    }

    return;
  }
}
