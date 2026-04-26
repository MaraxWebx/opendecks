import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";
import { sendMembershipCardEmail } from "@/lib/email";
import { getDjRosterEntries, updateDjRosterMembership } from "@/lib/data";
import { buildMembershipCardPdf, createMembershipCardId } from "@/lib/membership-card";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const body = (await request.json()) as { enabled?: boolean };

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Valore membership non valido." }, { status: 400 });
  }

  const roster = await getDjRosterEntries();
  const current = roster.find((item) => item.id === id);

  if (!current) {
    return NextResponse.json({ error: "DJ roster non trovato." }, { status: 404 });
  }

  if (!current.email) {
    return NextResponse.json(
      { error: "Il DJ non ha un'email salvata. Aggiorna la candidatura prima di emettere la card." },
      { status: 400 }
    );
  }

  if (!body.enabled) {
    const updated = await updateDjRosterMembership(id, { membershipCardEnabled: false });

    if (!updated) {
      return NextResponse.json({ error: "Aggiornamento membership non riuscito." }, { status: 500 });
    }

    return NextResponse.json({ rosterEntry: updated });
  }

  const membershipCardId = current.membershipCardId || createMembershipCardId();
  const membershipCardIssuedAt = current.membershipCardIssuedAt || new Date().toISOString();
  const draftRecord = {
    ...current,
    membershipCardEnabled: true,
    membershipCardId,
    membershipCardIssuedAt
  };

  const pdfBuffer = buildMembershipCardPdf(draftRecord);
  await sendMembershipCardEmail({
    to: current.email,
    djName: current.name,
    membershipCardId,
    pdfBuffer
  });

  const updated = await updateDjRosterMembership(id, {
    membershipCardEnabled: true,
    membershipCardId,
    membershipCardIssuedAt,
    membershipCardEmailSentAt: new Date().toISOString()
  });

  if (!updated) {
    return NextResponse.json({ error: "Aggiornamento membership non riuscito." }, { status: 500 });
  }

  return NextResponse.json({ rosterEntry: updated });
}
