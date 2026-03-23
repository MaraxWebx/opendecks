import { NextRequest, NextResponse } from "next/server";

import { deleteEvent, getApplications, getDjRosterEntries, updateEvent } from "@/lib/data";

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const force = request.nextUrl.searchParams.get("force") === "true";

  const [applications, djRoster] = await Promise.all([
    getApplications(),
    getDjRosterEntries()
  ]);

  const linkedApplicationsCount = applications.filter(
    (application) => application.eventId === id
  ).length;
  const linkedDjCount = djRoster.filter((record) => record.eventId === id).length;

  if (!force && (linkedApplicationsCount > 0 || linkedDjCount > 0)) {
    return NextResponse.json(
      {
        error:
          "Questo evento ha candidature o DJ collegati. Conferma l'eliminazione per procedere.",
        linkedApplicationsCount,
        linkedDjCount,
        requiresConfirmation: true
      },
      { status: 409 }
    );
  }

  const deleted = await deleteEvent(id);

  if (!deleted) {
    return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    linkedApplicationsCount,
    linkedDjCount
  });
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
