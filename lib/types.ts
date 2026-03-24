export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string;
  coverImage: string;
  coverAlt: string;
  date: string;
  time: string;
  status: "upcoming" | "past";
  excerpt: string;
  description: string;
  capacity: number;
  applicationsOpen: boolean;
  lineupPublished: boolean;
  tagIds: string[];
};

export type TagRecord = {
  id: string;
  slug: string;
  label: string;
};

export type ApplicationRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
  submittedAt: string;
  status: "new" | "reviewing" | "selected";
};

export type DjRosterRecord = {
  id: string;
  applicationId: string;
  eventId: string;
  eventTitle: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
  approvedAt: string;
  membershipCardEnabled: boolean;
  membershipCardId?: string;
  membershipCardIssuedAt?: string;
  membershipCardEmailSentAt?: string;
};

export type ArchiveRecord = {
  id: string;
  title: string;
  format: "gallery";
  mediaType: "photo" | "video" | "gif";
  mediaUrl: string;
  thumbnailUrl?: string;
  alt: string;
  event: string;
  year: string;
  description: string;
  order: number;
  linkUrl?: string;
};
