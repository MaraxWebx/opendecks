import { NextRequest, NextResponse } from "next/server";

import { updateArchiveEntry } from "@/lib/data";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const body = await request.json();
  const { id } = await params;

  const item = await updateArchiveEntry(id, {
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

  if (!item) {
    return NextResponse.json({ error: "Elemento archive non trovato." }, { status: 404 });
  }

  return NextResponse.json({ item });
}
