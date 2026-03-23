import { NextRequest, NextResponse } from "next/server";

import { updateEvent } from "@/lib/data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const event = await updateEvent(id, {
    slug: body.title ? createSlug(body.title) : undefined,
    title: body.title,
    city: body.city,
    venue: body.venue,
    coverImage: body.coverImage,
    coverAlt: body.coverAlt,
    date: body.date,
    time: body.time,
    excerpt: body.excerpt,
    description: body.description,
    applicationsOpen:
      body.applicationsOpen !== undefined ? Boolean(body.applicationsOpen) : undefined,
    tagIds: Array.isArray(body.tagIds) ? body.tagIds : undefined,
    status: body.status
  });

  if (!event) {
    return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
  }

  return NextResponse.json({ event });
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
