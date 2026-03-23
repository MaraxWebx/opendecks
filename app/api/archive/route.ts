import { NextRequest, NextResponse } from "next/server";

import { createArchiveEntry, getArchiveEntries } from "@/lib/data";

export async function GET() {
  const items = await getArchiveEntries();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const requiredFields = [
    "title",
    "format",
    "mediaType",
    "mediaUrl",
    "alt",
    "event",
    "year",
    "description",
    "order"
  ];

  const missingField = requiredFields.find((field) => !body?.[field] && body?.[field] !== 0);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 }
    );
  }

  const item = await createArchiveEntry({
    title: body.title,
    format: "gallery",
    mediaType: body.mediaType,
    mediaUrl: body.mediaUrl,
    thumbnailUrl: body.thumbnailUrl,
    alt: body.alt,
    event: body.event,
    year: body.year,
    description: body.description,
    order: Number(body.order)
  });

  return NextResponse.json({ item }, { status: 201 });
}
