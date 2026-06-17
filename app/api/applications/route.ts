import { NextRequest, NextResponse } from "next/server";

import { createApplication, getApplications, getEvents } from "@/lib/data";
import {
  sendApplicationConfirmationEmail,
  sendApplicationNotificationEmail,
} from "@/lib/email";
import { buildPrivacyConsentRecord } from "@/lib/privacy";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimitResponse = applyRateLimit({
    key: `applications:${ip}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
    message: "Troppi invii candidatura. Riprova tra qualche minuto.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json();
  const normalizedPayload = normalizeApplicationPayload(body);
  const validationError = validateApplicationPayload(normalizedPayload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!body?.privacyAccepted) {
    return NextResponse.json(
      { error: "Devi accettare la Privacy Policy." },
      { status: 400 }
    );
  }

  const recaptchaValid = await verifyRecaptchaToken(body?.recaptchaToken, ip);

  if (!recaptchaValid) {
    return NextResponse.json(
      { error: "Verifica reCAPTCHA non valida. Riprova." },
      { status: 400 },
    );
  }

  const [applications, events] = await Promise.all([getApplications(), getEvents()]);
  const existingApplication = applications.find(
    (application) => application.email.trim().toLowerCase() === normalizedPayload.email
  );

  if (existingApplication) {
    return NextResponse.json(
      { error: "Esiste già una candidatura associata a questa email." },
      { status: 409 }
    );
  }

  const relatedEvent = events.find((event) => event.id === normalizedPayload.eventId);

  if (!relatedEvent) {
    return NextResponse.json(
      { error: "Evento non valido o non piu disponibile." },
      { status: 400 }
    );
  }

  if (!relatedEvent.applicationsOpen) {
    return NextResponse.json(
      { error: "Le candidature per questo evento sono chiuse." },
      { status: 400 }
    );
  }

  const application = await createApplication({
    eventId: normalizedPayload.eventId,
    eventTitle: relatedEvent.title,
    name: normalizedPayload.name,
    city: normalizedPayload.city,
    province: normalizedPayload.province,
    region: normalizedPayload.region,
    email: normalizedPayload.email,
    phone: normalizedPayload.phone,
    photoUrl: normalizedPayload.photoUrl,
    instagram: normalizedPayload.instagram,
    setLink: normalizedPayload.setLink,
    bio: normalizedPayload.bio,
    ...buildPrivacyConsentRecord()
  });

  try {
    await sendApplicationConfirmationEmail({
      to: application.email,
      applicantName: application.name,
      eventTitle: application.eventTitle,
      eventDate: relatedEvent?.date,
      eventTime: relatedEvent?.time,
      locationName: relatedEvent?.locationName,
      locationAddress: relatedEvent?.locationAddress,
      city: application.city,
      province: application.province,
      region: application.region,
      submittedAt: application.submittedAt
    });
  } catch (error) {
    console.error("Application confirmation email failed", error);
  }

  try {
    await sendApplicationNotificationEmail({
      applicationId: application.id,
      applicantName: application.name,
      applicantEmail: application.email,
      phone: application.phone,
      instagram: application.instagram,
      setLink: application.setLink,
      eventTitle: application.eventTitle,
      eventDate: relatedEvent?.date,
      eventTime: relatedEvent?.time,
      locationName: relatedEvent?.locationName,
      locationAddress: relatedEvent?.locationAddress,
      city: application.city,
      province: application.province,
      region: application.region,
      submittedAt: application.submittedAt
    });
  } catch (error) {
    console.error("Application notification email failed", error);
  }

  return NextResponse.json({ application }, { status: 201 });
}

type NormalizedApplicationPayload = {
  eventId: string;
  eventTitle: string;
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
};

function normalizeApplicationPayload(body: unknown): NormalizedApplicationPayload {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  return {
    eventId: normalizeString(input.eventId),
    eventTitle: normalizeString(input.eventTitle),
    name: normalizeString(input.name),
    city: normalizeString(input.city),
    province: normalizeString(input.province),
    region: normalizeString(input.region),
    email: normalizeString(input.email).toLowerCase(),
    phone: normalizeString(input.phone),
    photoUrl: normalizeString(input.photoUrl),
    instagram: normalizeString(input.instagram),
    setLink: normalizeString(input.setLink),
    bio: normalizeString(input.bio),
  };
}

function validateApplicationPayload(input: NormalizedApplicationPayload) {
  const requiredFields: Array<[keyof NormalizedApplicationPayload, string]> = [
    ["eventId", "evento"],
    ["eventTitle", "titolo evento"],
    ["name", "nome"],
    ["city", "citta"],
    ["email", "email"],
    ["phone", "telefono"],
    ["photoUrl", "foto"],
    ["instagram", "link Instagram"],
    ["setLink", "link set"],
  ];

  for (const [field, label] of requiredFields) {
    if (!input[field]) {
      return `Campo obbligatorio mancante: ${label}`;
    }
  }

  if (!isValidEmail(input.email)) {
    return "Inserisci un indirizzo email valido.";
  }

  if (!isValidHttpUrl(input.instagram)) {
    return "Inserisci un link Instagram valido.";
  }

  if (!isValidHttpUrl(input.setLink)) {
    return "Inserisci un link set valido.";
  }

  if (!isValidHttpUrl(input.photoUrl)) {
    return "La foto caricata non ha un URL valido.";
  }

  return "";
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
