import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";
import { deleteDjRosterEntry, getDjRosterEntries, updateDjRosterEntry } from "@/lib/data";
import { getItalianProvince, italianProvinceCodes } from "@/lib/italian-provinces";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
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
    (entry) => entry.id !== id && entry.email.trim().toLowerCase() === normalizedEmail,
  );

  if (existingRosterEntry) {
    return NextResponse.json(
      { error: "Esiste già un DJ roster associato a questa email." },
      { status: 409 },
    );
  }

  const province = getItalianProvince(body.province);
  const rosterEntry = await updateDjRosterEntry(id, {
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

  if (!rosterEntry) {
    return NextResponse.json({ error: "DJ roster non trovato." }, { status: 404 });
  }

  return NextResponse.json({ rosterEntry });
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const deleted = await deleteDjRosterEntry(id);

  if (!deleted) {
    return NextResponse.json({ error: "DJ roster non trovato." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
