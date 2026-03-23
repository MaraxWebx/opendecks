import { NextRequest, NextResponse } from "next/server";

import { deleteArchiveEntry, updateArchiveEntry } from "@/lib/data";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const body = await request.json();
  const { id } = await params;

  const item = await updateArchiveEntry(id, {
    title: body.title || body.event || body.alt,
    format: "gallery",
    mediaType: body.mediaType || inferMediaType(body.mediaUrl),
    mediaUrl: body.mediaUrl,
    thumbnailUrl: body.thumbnailUrl,
    alt: body.alt,
    event: body.event || "",
    year: body.year || undefined,
    description: body.description || undefined,
    order: Number(body.order),
    linkUrl: body.linkUrl || undefined
  });

  if (!item) {
    return NextResponse.json({ error: "Elemento archive non trovato." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const deleted = await deleteArchiveEntry(id);

  if (!deleted) {
    return NextResponse.json({ error: "Elemento gallery non trovato." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
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
