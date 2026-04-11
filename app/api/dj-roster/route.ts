import { NextRequest, NextResponse } from "next/server";

import { createDjRosterEntry, getDjRosterEntries, getEvents } from "@/lib/data";
import { getItalianProvince, italianProvinceCodes } from "@/lib/italian-provinces";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const requiredFields = [
    "name",
    "city",
    "province",
    "email",
    "phone",
    "instagram",
    "setLink",
  ];
  const missingField = requiredFields.find((field) => !body?.[field]);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 },
    );
  }

  if (!italianProvinceCodes.includes(body.province)) {
    return NextResponse.json({ error: "Provincia non valida." }, { status: 400 });
  }

  const roster = await getDjRosterEntries();

  const normalizedEmail = String(body.email).trim().toLowerCase();
  const existingRosterEntry = roster.find(
    (entry) => entry.email.trim().toLowerCase() === normalizedEmail,
  );

  if (existingRosterEntry) {
    return NextResponse.json(
      { error: "Esiste gia un DJ roster associato a questa email." },
      { status: 409 },
    );
  }

  const province = getItalianProvince(body.province);
  let relatedEvent = null;

  if (body.eventId) {
    const events = await getEvents();
    relatedEvent = events.find((event) => event.id === body.eventId) || null;

    if (!relatedEvent) {
      return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
    }
  }

  const rosterEntry = await createDjRosterEntry({
    eventId: relatedEvent?.id || "",
    eventTitle: relatedEvent?.title || "",
    name: String(body.name).trim(),
    city: String(body.city).trim(),
    province: body.province,
    region: province?.region || "",
    email: normalizedEmail,
    phone: String(body.phone).trim(),
    photoUrl: String(body.photoUrl || "").trim(),
    instagram: String(body.instagram).trim(),
    setLink: String(body.setLink).trim(),
    bio: String(body.bio || "").trim(),
  });

  return NextResponse.json({ rosterEntry }, { status: 201 });
}
