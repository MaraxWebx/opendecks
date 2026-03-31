import { ObjectId } from "mongodb";
import { unstable_noStore as noStore } from "next/cache";

import { canAttemptMongo, getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { mockApplications, mockArchive, mockDjRoster, mockEvents, mockLocations, mockTags } from "@/lib/mock-data";
import { ApplicationRecord, ArchiveRecord, DjRosterRecord, EventRecord, LocationRecord, TagRecord } from "@/lib/types";

type NewApplication = Omit<ApplicationRecord, "id" | "submittedAt" | "status">;
type NewEvent = Omit<EventRecord, "id" | "status" | "eventNumber"> & { eventNumber?: number };
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
type NewLocation = Omit<LocationRecord, "id">;
type UpdateLocationInput = Partial<NewLocation>;

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

export async function createLocation(input: NewLocation) {
  if (!isMongoConfigured()) {
    return createLocationMock(input);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const record: LocationRecord = {
        id: new ObjectId().toHexString(),
        ...input
      };

      await db.collection<LocationRecord>("locations").insertOne(record);
      return record;
    },
    () => createLocationMock(input)
  );
}

export async function updateLocation(id: string, input: UpdateLocationInput) {
  if (!isMongoConfigured()) {
    return updateLocationMock(id, input);
  }

  return withMongoFallback(
    async () => {
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
    },
    () => updateLocationMock(id, input)
  );
}

export async function deleteLocation(id: string) {
  if (!isMongoConfigured()) {
    return deleteLocationMock(id);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const linkedEvents = await db.collection<EventRecord>("events").countDocuments({ locationId: id });

      if (linkedEvents > 0) {
        return { deleted: false, blocked: true };
      }

      const result = await db.collection<LocationRecord>("locations").deleteOne({ id });
      return { deleted: Boolean(result.deletedCount), blocked: false };
    },
    () => deleteLocationMock(id)
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

export async function deleteApplication(id: string) {
  if (!isMongoConfigured()) {
    return deleteApplicationMock(id);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const result = await db.collection<ApplicationRecord>("applications").deleteOne({ id });

      if (!result.deletedCount) {
        return false;
      }

      await db.collection<DjRosterRecord>("dj_roster").deleteOne({ applicationId: id });
      return true;
    },
    () => deleteApplicationMock(id)
  );
}

export async function createEvent(input: NewEvent) {
  const nextEventNumber = await getNextEventNumber(input.locationId);
  const requestedEventNumber = input.eventNumber || nextEventNumber;

  if (!isMongoConfigured()) {
    const existing = mockEvents.find(
      (event) =>
        event.locationId === input.locationId && event.eventNumber === requestedEventNumber
    );

    if (existing) {
      throw new Error("Numero evento gia assegnato a questa location.");
    }

    const record: EventRecord = {
      id: new ObjectId().toHexString(),
      eventNumber: requestedEventNumber,
      status: getEventStatusFromDate(input.date),
      ...input
    };
    mockEvents.push(record);
    return sortEvents(mockEvents).find((event) => event.id === record.id) || record;
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const existing = await db
        .collection<EventRecord>("events")
        .findOne({ locationId: input.locationId, eventNumber: requestedEventNumber });

      if (existing) {
        throw new Error("Numero evento gia assegnato a questa location.");
      }

      const record: EventRecord = {
        id: new ObjectId().toHexString(),
        eventNumber: requestedEventNumber,
        status: getEventStatusFromDate(input.date),
        ...input
      };
      await db.collection<EventRecord>("events").insertOne(record);
      return record;
    },
    () => {
      const existing = mockEvents.find(
        (event) =>
          event.locationId === input.locationId && event.eventNumber === requestedEventNumber
      );

      if (existing) {
        throw new Error("Numero evento gia assegnato a questa location.");
      }

      const record: EventRecord = {
        id: new ObjectId().toHexString(),
        eventNumber: requestedEventNumber,
        status: getEventStatusFromDate(input.date),
        ...input
      };
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
      const current = await db.collection<EventRecord>("events").findOne({ id });

      if (!current) {
        return null;
      }

      if (
        typeof input.eventNumber === "number" &&
        input.eventNumber > 0 &&
        (input.eventNumber !== current.eventNumber ||
          (input.locationId && input.locationId !== current.locationId))
      ) {
        const targetLocationId = input.locationId || current.locationId;
        const existing = await db
          .collection<EventRecord>("events")
          .findOne({
            locationId: targetLocationId,
            eventNumber: input.eventNumber,
            id: { $ne: id } as any
          });

        if (existing) {
          throw new Error("Numero evento gia assegnato a questa location.");
        }
      }

      const nextInput = {
        ...input,
        status: input.date ? getEventStatusFromDate(input.date) : current.status
      };

      await db.collection<EventRecord>("events").updateOne({ id }, { $set: nextInput });
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

async function getNextEventNumber(locationId: string) {
  const events = await getEvents();
  const maxEventNumber = events
    .filter((event) => event.locationId === locationId)
    .reduce((max, event) => Math.max(max, event.eventNumber || 0), 0);
  return maxEventNumber + 1;
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

export async function deleteArchiveEntry(id: string) {
  if (!isMongoConfigured()) {
    return deleteArchiveMock(id);
  }

  return withMongoFallback(
    async () => {
      const db = await getDatabase();
      const result = await db.collection<ArchiveRecord>("archive").deleteOne({ id });
      return Boolean(result.deletedCount);
    },
    () => deleteArchiveMock(id)
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

  if (
    typeof input.eventNumber === "number" &&
    input.eventNumber > 0 &&
    mockEvents.some(
      (item) =>
        item.id !== id &&
        item.locationId === (input.locationId || mockEvents[index].locationId) &&
        item.eventNumber === input.eventNumber
    )
  ) {
    throw new Error("Numero evento gia assegnato a questa location.");
  }

  mockEvents[index] = {
    ...mockEvents[index],
    ...input,
    status: input.date ? getEventStatusFromDate(input.date) : mockEvents[index].status
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

function deleteApplicationMock(id: string) {
  const index = mockApplications.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  mockApplications.splice(index, 1);

  const rosterIndex = mockDjRoster.findIndex((item) => item.applicationId === id);
  if (rosterIndex !== -1) {
    mockDjRoster.splice(rosterIndex, 1);
  }

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
    ...event,
    eventNumber: Number(event.eventNumber) || 1,
    lineupPublished: Boolean(event.lineupPublished),
    lineupDjIds: event.lineupDjIds || [],
    tagIds: event.tagIds || [],
    id: event.id || _id?.toHexString() || new ObjectId().toHexString()
  };
}

function getEventStatusFromDate(date: string): EventRecord["status"] {
  return date >= new Date().toISOString().slice(0, 10) ? "upcoming" : "past";
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
    const rosterRecord: DjRosterRecord = {
      id: application.id,
      applicationId: application.id,
      eventId: application.eventId,
      eventTitle: application.eventTitle,
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
      province: application.province || "",
      region: application.region || "",
      email: application.email,
      phone: application.phone,
      photoUrl: application.photoUrl,
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
