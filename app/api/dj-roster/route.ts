import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";
import { createDjRosterEntry, getDjRosterEntries } from "@/lib/data";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();

    const requiredFields = [
      "name",
      "city",
      "email",
      "phone",
    ];
    const missingField = requiredFields.find((field) => !body?.[field]);

    if (missingField) {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${missingField}` },
        { status: 400 },
      );
    }

    const roster = await getDjRosterEntries();

    const normalizedEmail = String(body.email).trim().toLowerCase();
    const existingRosterEntry = roster.find(
      (entry) => entry.email.trim().toLowerCase() === normalizedEmail,
    );

    if (existingRosterEntry) {
      return NextResponse.json(
        { error: "Esiste già un DJ roster associato a questa email." },
        { status: 409 },
      );
    }

    const rosterEntry = await createDjRosterEntry({
      name: String(body.name).trim(),
      city: String(body.city).trim(),
      province: String(body.province || "").trim(),
      region: String(body.region || "").trim(),
      email: normalizedEmail,
      phone: String(body.phone).trim(),
      photoUrl: String(body.photoUrl || "").trim(),
      instagram: String(body.instagram).trim(),
      setLink: String(body.setLink).trim(),
      bio: String(body.bio || "").trim(),
    });

    return NextResponse.json({ rosterEntry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Creazione DJ roster non riuscita.",
      },
      { status: 500 },
    );
  }
}
