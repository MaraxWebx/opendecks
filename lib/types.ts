export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  coverImage: string;
  coverAlt: string;
  date: string;
  time: string;
  status: "upcoming" | "past";
  description: string;
  capacity: number;
  applicationsOpen: boolean;
  lineupPublished: boolean;
  lineupDjIds: string[];
  tagIds: string[];
};

export type LocationRecord = {
  id: string;
  name: string;
  address: string;
  socialLink: string;
  phone: string;
  description: string;
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
  province?: string;
  region?: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
  submittedAt: string;
  privacyPolicyVersion: string;
  privacyAcceptedAt: string;
  status: "new" | "reviewing" | "selected";
};

export type ContactSubmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: string;
  privacyPolicyVersion: string;
  privacyAcceptedAt: string;
  source: "contact_form";
};

export type DjRosterRecord = {
  id: string;
  applicationId?: string;
  sourceApplicationEventId?: string;
  sourceApplicationEventTitle?: string;
  name: string;
  city: string;
  province?: string;
  region?: string;
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
