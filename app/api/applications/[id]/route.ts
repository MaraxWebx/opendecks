import { NextRequest, NextResponse } from "next/server";

import { updateApplication } from "@/lib/data";
import { ApplicationRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as Partial<Pick<ApplicationRecord, "status">>;

  if (!body.status || !["new", "reviewing", "selected"].includes(body.status)) {
    return NextResponse.json({ error: "Stato candidatura non valido." }, { status: 400 });
  }

  const application = await updateApplication(id, { status: body.status });

  if (!application) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  return NextResponse.json({ application });
}
