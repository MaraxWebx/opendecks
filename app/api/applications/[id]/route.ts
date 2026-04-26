import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";
import { deleteApplication, getApplications, getEvents, updateApplication } from "@/lib/data";
import { sendApplicationApprovedEmail } from "@/lib/email";
import { ApplicationRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Partial<Pick<ApplicationRecord, "status">>;

  if (!body.status || !["new", "reviewing", "selected"].includes(body.status)) {
    return NextResponse.json({ error: "Stato candidatura non valido." }, { status: 400 });
  }

  const applications = await getApplications();
  const currentApplication = applications.find((application) => application.id === id);

  if (!currentApplication) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  const application = await updateApplication(id, { status: body.status });

  if (!application) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  if (currentApplication.status !== "selected" && application.status === "selected") {
    const events = await getEvents();
    const linkedEvent = events.find((event) => event.id === application.eventId) || null;
    const isFutureEvent = linkedEvent?.status === "upcoming";

    try {
      await sendApplicationApprovedEmail({
        to: application.email,
        applicantName: application.name,
        eventTitle: isFutureEvent ? application.eventTitle : undefined,
        eventDate: isFutureEvent ? linkedEvent?.date : undefined,
        eventTime: isFutureEvent ? linkedEvent?.time : undefined,
        locationName: isFutureEvent ? linkedEvent?.locationName : undefined,
        locationAddress: isFutureEvent ? linkedEvent?.locationAddress : undefined,
        rosterOnly: !isFutureEvent,
      });
    } catch (error) {
      console.error("Application approval email failed:", error);
    }
  }

  return NextResponse.json({ application });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const deleted = await deleteApplication(id);

  if (!deleted) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
