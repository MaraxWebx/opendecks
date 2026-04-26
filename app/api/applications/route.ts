import { NextRequest, NextResponse } from "next/server";

import { createApplication, getApplications, getEvents } from "@/lib/data";
import {
  sendApplicationConfirmationEmail,
  sendApplicationNotificationEmail,
} from "@/lib/email";
import { getItalianProvince, italianProvinceCodes } from "@/lib/italian-provinces";
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

  const requiredFields = ["eventId", "eventTitle", "name", "city", "province", "email", "phone", "photoUrl", "instagram", "setLink"];
  const missingField = requiredFields.find((field) => !body?.[field]);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 }
    );
  }

  if (!italianProvinceCodes.includes(body.province)) {
    return NextResponse.json(
      { error: "Provincia non valida." },
      { status: 400 }
    );
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

  const normalizedEmail = String(body.email).trim().toLowerCase();
  const [applications, events] = await Promise.all([getApplications(), getEvents()]);
  const existingApplication = applications.find(
    (application) => application.email.trim().toLowerCase() === normalizedEmail
  );

  if (existingApplication) {
    return NextResponse.json(
      { error: "Esiste già una candidatura associata a questa email." },
      { status: 409 }
    );
  }

  const province = getItalianProvince(body.province);
  const relatedEvent = events.find((event) => event.id === body.eventId);

  const application = await createApplication({
    eventId: body.eventId,
    eventTitle: body.eventTitle,
    name: body.name,
    city: body.city,
    province: body.province,
    region: province?.region || "",
    email: normalizedEmail,
    phone: body.phone,
    photoUrl: body.photoUrl,
    instagram: body.instagram,
    setLink: body.setLink,
    bio: body.bio || "",
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
