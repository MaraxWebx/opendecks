import { NextRequest, NextResponse } from "next/server";

import { createApplication, getApplications } from "@/lib/data";
import { getItalianProvince, italianProvinceCodes } from "@/lib/italian-provinces";

export async function POST(request: NextRequest) {
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

  const normalizedEmail = String(body.email).trim().toLowerCase();
  const applications = await getApplications();
  const existingApplication = applications.find(
    (application) => application.email.trim().toLowerCase() === normalizedEmail
  );

  if (existingApplication) {
    return NextResponse.json(
      { error: "Esiste gia una candidatura associata a questa email." },
      { status: 409 }
    );
  }

  const province = getItalianProvince(body.province);

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
    bio: body.bio || ""
  });

  return NextResponse.json({ application }, { status: 201 });
}
