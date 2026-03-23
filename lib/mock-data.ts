import { ArchiveRecord, ApplicationRecord, DjRosterRecord, EventRecord, TagRecord } from "@/lib/types";
import seedData from "@/data/seed-data.json";

export const mockEvents = seedData.events as EventRecord[];
export const mockApplications = seedData.applications as ApplicationRecord[];
export const mockArchive = seedData.archive as ArchiveRecord[];
export const mockDjRoster = (seedData.djRoster || []) as DjRosterRecord[];
export const mockTags = (seedData.tags || []) as TagRecord[];
