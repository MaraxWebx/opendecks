import { NextRequest, NextResponse } from "next/server";

import { createContactSubmission } from "@/lib/data";
import { sendContactEmail } from "@/lib/email";
import { buildPrivacyConsentRecord } from "@/lib/privacy";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rateLimitResponse = applyRateLimit({
      key: `contact:${ip}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      message: "Troppi invii dal form contatti. Riprova tra qualche minuto.",
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const requiredFields = ["name", "email", "message"];
    const missingField = requiredFields.find((field) => !body?.[field]);

    if (missingField) {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${missingField}` },
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

    await createContactSubmission({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      message: body.message,
      source: "contact_form",
      ...buildPrivacyConsentRecord()
    });

    await sendContactEmail({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      message: body.message
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invio messaggio non riuscito." },
      { status: 500 }
    );
  }
}
