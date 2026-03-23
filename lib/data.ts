import { ObjectId } from "mongodb";
import { unstable_noStore as noStore } from "next/cache";

import { canAttemptMongo, getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { mockApplications, mockArchive, mockDjRoster, mockEvents, mockTags } from "@/lib/mock-data";
import { ApplicationRecord, ArchiveRecord, DjRosterRecord, EventRecord, TagRecord } from "@/lib/types";

type NewApplication = Omit<ApplicationRecord, "id" | "submittedAt" | "status">;
type NewEvent = Omit<EventRecord, "id" | "status"> & { status?: EventRecord["status"] };
type UpdateEventInput = Partial<Omit<EventRecord, "id">>;
type NewArchiveEntry = Omit<ArchiveRecord, "id">;
type UpdateArchiveEntry = Partial<NewArchiveEntry>;
type UpdateApplicationInput = Partial<Pick<ApplicationRecord, "status">>;
type UpdateDjRosterMembershipInput = {
  membershipCardEnabled: boolean;
  membershipCardId?: string;
  membershipCardIssuedAt?: string;
  membershipCardEmailSentAt?: string;
};
type NewTag = Omit<TagRecord, "id">;

function sortEvents(events: EventRecord[]) {
  return [...events].sort((a, b) => b.date.localeCompare(a.date));
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

  const now = new Date().toISOString().slice(0, 10);
  const events = await getEvents();
  const upcomingEvents = events
    .filter((event) => event.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date));

  return upcomingEvents[0] || events[0] || null;
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

export async function createTag(input: NewTag) {
  if (!isMongoConfigured()) {
    return createTagMock(input);
  }

  return withMongoFallback(
    async () => {
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
    },
    () => createTagMock(input)
  );
}

export async function updateDjRosterMembership(
  id: string,
  input: UpdateDjRosterMembershipInput
) {
  if (!isMongoConfigured()) {
    return updateDjRosterMembershipMock(id, input);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<DjRosterRecord>("dj_roster").updateOne({ id }, { $set: input });
      const updated = await db.collection<DjRosterRecord>("dj_roster").findOne({ id });
      return updated ? normalizeDjRoster(updated) : null;
    },
    () => updateDjRosterMembershipMock(id, input)
  );
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

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<ApplicationRecord>("applications").insertOne(record);
      return record;
    },
    () => {
      mockApplications.unshift(record);
      return record;
    }
  );
}

export async function updateApplication(id: string, input: UpdateApplicationInput) {
  if (!isMongoConfigured()) {
    return updateApplicationMock(id, input);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<ApplicationRecord>("applications").updateOne({ id }, { $set: input });
      const updated = await db.collection<ApplicationRecord>("applications").findOne({ id });

      if (!updated) {
        return null;
      }

      const normalized = normalizeApplication(updated);
      await syncDjRosterForApplication(db, normalized);
      return normalized;
    },
    () => updateApplicationMock(id, input)
  );
}

export async function createEvent(input: NewEvent) {
  const record: EventRecord = {
    id: new ObjectId().toHexString(),
    status: input.status || (input.date >= new Date().toISOString().slice(0, 10) ? "upcoming" : "past"),
    ...input
  };

  if (!isMongoConfigured()) {
    mockEvents.push(record);
    return sortEvents(mockEvents).find((event) => event.id === record.id) || record;
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<EventRecord>("events").insertOne(record);
      return record;
    },
    () => {
      mockEvents.push(record);
      return sortEvents(mockEvents).find((event) => event.id === record.id) || record;
    }
  );
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  if (!isMongoConfigured()) {
    return updateEventMock(id, input);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<EventRecord>("events").updateOne({ id }, { $set: input });
      const updated = await db.collection<EventRecord>("events").findOne({ id });
      return updated ? normalizeEvent(updated) : null;
    },
    () => updateEventMock(id, input)
  );
}

export async function deleteEvent(id: string) {
  if (!isMongoConfigured()) {
    return deleteEventMock(id);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const eventDeleteResult = await db.collection<EventRecord>("events").deleteOne({ id });

      if (!eventDeleteResult.deletedCount) {
        return false;
      }

      await db.collection<ApplicationRecord>("applications").deleteMany({ eventId: id });
      await db.collection<DjRosterRecord>("dj_roster").deleteMany({ eventId: id });

      return true;
    },
    () => deleteEventMock(id)
  );
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

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<ArchiveRecord>("archive").insertOne(record);
      return record;
    },
    () => {
      mockArchive.push(record);
      mockArchive.sort((a, b) => a.order - b.order);
      return record;
    }
  );
}

export async function updateArchiveEntry(id: string, input: UpdateArchiveEntry) {
  if (!isMongoConfigured()) {
    return updateArchiveMock(id, input);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      await db.collection<ArchiveRecord>("archive").updateOne({ id }, { $set: input });
      const updated = await db.collection<ArchiveRecord>("archive").findOne({ id });
      return updated ? normalizeArchive(updated) : null;
    },
    () => updateArchiveMock(id, input)
  );
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

function updateEventMock(id: string, input: UpdateEventInput) {
  const index = mockEvents.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockEvents[index] = {
    ...mockEvents[index],
    ...input
  };

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

  for (let cursor = mockDjRoster.length - 1; cursor >= 0; cursor -= 1) {
    if (mockDjRoster[cursor].eventId === id) {
      mockDjRoster.splice(cursor, 1);
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

function normalizeEvent(record: EventRecord & { _id?: ObjectId }) {
  const { _id, ...event } = record;

  return {
    ...event,
    tagIds: event.tagIds || [],
    id: event.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function normalizeApplication(record: ApplicationRecord & { _id?: ObjectId }) {
  const { _id, ...application } = record;

  return {
    ...application,
    email: application.email || "",
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
    email: roster.email || "",
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
    const rosterRecord: DjRosterRecord = {
      id: application.id,
      applicationId: application.id,
      eventId: application.eventId,
      eventTitle: application.eventTitle,
      name: application.name,
      city: application.city,
      email: application.email,
      instagram: application.instagram,
      setLink: application.setLink,
      bio: application.bio,
      approvedAt: new Date().toISOString(),
      membershipCardEnabled: false
    };

    await db
      .collection<DjRosterRecord>("dj_roster")
      .updateOne({ applicationId: application.id }, { $set: rosterRecord }, { upsert: true });
    return;
  }

  await db.collection<DjRosterRecord>("dj_roster").deleteOne({ applicationId: application.id });
}

function syncDjRosterMock(application: ApplicationRecord) {
  const existingIndex = mockDjRoster.findIndex((item) => item.applicationId === application.id);

  if (application.status === "selected") {
    const rosterRecord: DjRosterRecord = {
      id: application.id,
      applicationId: application.id,
      eventId: application.eventId,
      eventTitle: application.eventTitle,
      name: application.name,
      city: application.city,
      email: application.email,
      instagram: application.instagram,
      setLink: application.setLink,
      bio: application.bio,
      approvedAt: new Date().toISOString(),
      membershipCardEnabled: false
    };

    if (existingIndex === -1) {
      mockDjRoster.unshift(rosterRecord);
    } else {
      mockDjRoster[existingIndex] = rosterRecord;
    }

    return;
  }

  if (existingIndex !== -1) {
    mockDjRoster.splice(existingIndex, 1);
  }
}
