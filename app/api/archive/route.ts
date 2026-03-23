import { NextRequest, NextResponse } from "next/server";

import { createArchiveEntry, getArchiveEntries } from "@/lib/data";

export async function GET() {
  const items = await getArchiveEntries();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const requiredFields = ["mediaUrl", "alt", "order"];

  const missingField = requiredFields.find((field) => !body?.[field] && body?.[field] !== 0);

  if (missingField) {
    return NextResponse.json(
      { error: `Campo obbligatorio mancante: ${missingField}` },
      { status: 400 }
    );
  }

  const item = await createArchiveEntry({
    title: body.title || body.event || body.alt,
    format: "gallery",
    mediaType: body.mediaType || inferMediaType(body.mediaUrl),
    mediaUrl: body.mediaUrl,
    thumbnailUrl: body.thumbnailUrl,
    alt: body.alt,
    event: body.event || "",
    year: body.year || new Date().getFullYear().toString(),
    description: body.description || "",
    order: Number(body.order),
    linkUrl: body.linkUrl || undefined
  });

  return NextResponse.json({ item }, { status: 201 });
}

function inferMediaType(mediaUrl: string): "photo" | "video" | "gif" {
  const normalized = mediaUrl.toLowerCase();

  if (normalized.endsWith(".gif")) {
    return "gif";
  }

  if (
    normalized.endsWith(".mp4") ||
    normalized.endsWith(".webm") ||
    normalized.endsWith(".mov")
  ) {
    return "video";
  }

  return "photo";
}
