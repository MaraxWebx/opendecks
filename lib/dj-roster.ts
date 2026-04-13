import { DjRosterRecord, EventRecord } from "@/lib/types";

export type DjRosterProfile = {
  id: string;
  name: string;
  city: string;
  email: string;
  instagram: string;
  photoUrl: string;
  bio: string;
  setLink: string;
  sourceEntries: DjRosterRecord[];
};

export function getDjIdentityKey(record: Pick<DjRosterRecord, "email" | "instagram" | "name">) {
  const email = record.email.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  const instagram = record.instagram.trim().toLowerCase();
  if (instagram) {
    return `instagram:${instagram.replace(/^@/, "")}`;
  }

  return `name:${record.name.trim().toLowerCase()}`;
}

export function buildDjRosterProfiles(roster: DjRosterRecord[]) {
  const profiles = new Map<string, DjRosterProfile>();

  for (const entry of roster) {
    const key = getDjIdentityKey(entry);
    const existing = profiles.get(key);

    if (!existing) {
      profiles.set(key, {
        id: entry.id,
        name: entry.name,
        city: entry.city,
        email: entry.email,
        instagram: entry.instagram,
        photoUrl: entry.photoUrl,
        bio: entry.bio,
        setLink: entry.setLink,
        sourceEntries: [entry]
      });
      continue;
    }

    existing.sourceEntries.push(entry);

    const existingApprovedAt =
      existing.sourceEntries.reduce(
        (latest, sourceEntry) =>
          sourceEntry.approvedAt > latest ? sourceEntry.approvedAt : latest,
        ""
      ) || "";
    if (entry.approvedAt > existingApprovedAt) {
      existing.id = entry.id;
      existing.name = entry.name;
      existing.city = entry.city;
      existing.email = entry.email;
      existing.instagram = entry.instagram;
      existing.photoUrl = entry.photoUrl;
      existing.bio = entry.bio;
      existing.setLink = entry.setLink;
    }
  }

  return [...profiles.values()].sort((a, b) => a.name.localeCompare(b.name, "it"));
}

export function getEventLineupDjs(event: EventRecord, roster: DjRosterRecord[]) {
  if (!event.lineupDjIds?.length) {
    return [];
  }

  return event.lineupDjIds
    .map((id) => roster.find((record) => record.id === id))
    .filter((record): record is DjRosterRecord => Boolean(record));
}

export function getDjEventHistory(
  targetDj: DjRosterRecord,
  events: EventRecord[],
  roster: DjRosterRecord[]
) {
  const identityKey = getDjIdentityKey(targetDj);
  const relatedRosterIds = new Set(
    roster
      .filter((entry) => getDjIdentityKey(entry) === identityKey)
      .map((entry) => entry.id)
  );
  const relatedEventIds = new Set<string>();

  for (const entry of roster) {
    if (getDjIdentityKey(entry) === identityKey && entry.sourceApplicationEventId) {
      relatedEventIds.add(entry.sourceApplicationEventId);
    }
  }

  for (const event of events) {
    if (event.lineupDjIds?.some((id) => relatedRosterIds.has(id))) {
      relatedEventIds.add(event.id);
    }
  }

  return events
    .filter((event) => relatedEventIds.has(event.id))
    .sort((a, b) => b.date.localeCompare(a.date));
}
