import { NextRequest, NextResponse } from "next/server";

import { deleteEvent, getApplications, getDjRosterEntries, getEvents, getLocations, updateEvent } from "@/lib/data";
import { sendDjEventAssignmentEmail } from "@/lib/email";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const [locations, djRoster] = await Promise.all([getLocations(), getDjRosterEntries()]);
    const selectedLocation = locations.find((location) => location.id === body.locationId);

    if (!selectedLocation) {
      return NextResponse.json({ error: "Location non valida." }, { status: 400 });
    }

    const event = await updateEvent(id, {
      slug: body.title ? createSlug(body.title) : undefined,
      title: body.title,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      locationAddress: selectedLocation.address,
      coverImage: body.coverImage,
      coverAlt: buildEventCoverAlt(body.title, selectedLocation.name),
      date: body.date,
      time: body.time,
      description: body.description,
      applicationsOpen:
        body.applicationsOpen !== undefined ? Boolean(body.applicationsOpen) : undefined,
      lineupPublished:
        body.lineupPublished !== undefined ? Boolean(body.lineupPublished) : undefined,
      lineupDjIds: Array.isArray(body.lineupDjIds) ? body.lineupDjIds : undefined,
      tagIds: Array.isArray(body.tagIds) ? body.tagIds : undefined
    });

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
    }

    const previousLineupIds = new Set(
      Array.isArray(body.previousLineupDjIds) ? body.previousLineupDjIds : []
    );
    const nextLineupIds = new Set(event.lineupDjIds || []);
    const addedDjIds = [...nextLineupIds].filter((djId) => !previousLineupIds.has(djId));

    if (addedDjIds.length) {
      await Promise.all(
        addedDjIds.map(async (djId) => {
          const dj = djRoster.find((entry) => entry.id === djId);

          if (!dj?.email) {
            return;
          }

          try {
            await sendDjEventAssignmentEmail({
              to: dj.email,
              djName: dj.name,
              eventTitle: event.title,
              eventDate: event.date,
              eventTime: event.time,
              locationName: event.locationName,
              locationAddress: event.locationAddress,
            });
          } catch (error) {
            console.error("Lineup assignment email failed:", error);
          }
        })
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Aggiornamento evento non riuscito." },
      { status: 409 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const force = request.nextUrl.searchParams.get("force") === "true";

  const [applications, events] = await Promise.all([
    getApplications(),
    getEvents()
  ]);
  const targetEvent = events.find((event) => event.id === id) || null;

  const linkedApplicationsCount = applications.filter(
    (application) => application.eventId === id
  ).length;
  const linkedDjCount = targetEvent?.lineupDjIds?.length || 0;

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

function buildEventCoverAlt(title: string, locationName: string) {
  return [title, locationName].filter(Boolean).join(" - ") || "Copertina evento";
}
