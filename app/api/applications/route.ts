import { NextRequest, NextResponse } from "next/server";

import { createApplication } from "@/lib/data";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const requiredFields = ["eventId", "eventTitle", "name", "city", "email", "phone", "photoUrl", "instagram", "setLink", "bio"];
  const missingField = requiredFields.find((field) => !body?.[field]);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 }
    );
  }

  const application = await createApplication({
    eventId: body.eventId,
    eventTitle: body.eventTitle,
    name: body.name,
    city: body.city,
    email: body.email,
    phone: body.phone,
    photoUrl: body.photoUrl,
    instagram: body.instagram,
    setLink: body.setLink,
    bio: body.bio
  });

  return NextResponse.json({ application }, { status: 201 });
}
