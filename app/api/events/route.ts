import { NextRequest, NextResponse } from "next/server";

import { createEvent, getEvents } from "@/lib/data";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const requiredFields = [
    "title",
    "city",
    "venue",
    "coverImage",
    "coverAlt",
    "date",
    "time",
    "excerpt",
    "description"
  ];

  const missingField = requiredFields.find((field) => !body?.[field] && body?.[field] !== 0);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 }
    );
  }

  const event = await createEvent({
    slug: createSlug(body.title),
    title: body.title,
    city: body.city,
    venue: body.venue,
    coverImage: body.coverImage,
    coverAlt: body.coverAlt,
    date: body.date,
    time: body.time,
    excerpt: body.excerpt,
    description: body.description,
    capacity: Number(body.capacity) || 0,
    applicationsOpen: Boolean(body.applicationsOpen),
    tagIds: Array.isArray(body.tagIds) ? body.tagIds : [],
    status: body.status
  });

  return NextResponse.json({ event }, { status: 201 });
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
