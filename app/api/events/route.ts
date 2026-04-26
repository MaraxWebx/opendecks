import { NextRequest, NextResponse } from "next/server";

import { createEvent, getEvents, getLocations } from "@/lib/data";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = [
      "title",
      "locationId",
      "coverImage",
      "date",
      "time"
    ];

    const missingField = requiredFields.find((field) => !body?.[field] && body?.[field] !== 0);

    if (missingField) {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${missingField}` },
        { status: 400 }
      );
    }

    const locations = await getLocations();
    const selectedLocation = locations.find((location) => location.id === body.locationId);

    if (!selectedLocation) {
      return NextResponse.json({ error: "Location non valida." }, { status: 400 });
    }

    const event = await createEvent({
      slug: createSlug(body.title),
      title: body.title,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      locationAddress: selectedLocation.address,
      coverImage: body.coverImage,
      coverAlt: buildEventCoverAlt(body.title, selectedLocation.name),
      date: body.date,
      time: body.time,
      description: body.description || "",
      capacity: Number(body.capacity) || 0,
      applicationsOpen: Boolean(body.applicationsOpen),
      lineupPublished: Boolean(body.lineupPublished),
      lineupDjIds: Array.isArray(body.lineupDjIds) ? body.lineupDjIds : [],
      tagIds: Array.isArray(body.tagIds) ? body.tagIds : []
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (isDuplicateEventSlugError(error)) {
      return NextResponse.json(
        {
          error:
            "Esiste già un evento con questo titolo. Modifica il titolo per generare uno slug diverso.",
          field: "title",
          code: "duplicate_event_slug",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Salvataggio evento non riuscito." },
      { status: 409 }
    );
  }
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildEventCoverAlt(title: string, locationName: string) {
  return [title, locationName].filter(Boolean).join(" - ") || "Copertina evento";
}

function isDuplicateEventSlugError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const mongoError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    message?: string;
  };

  return (
    mongoError.code === 11000 &&
    (mongoError.keyPattern?.slug === 1 ||
      mongoError.message?.includes("index: slug_1"))
  );
}
