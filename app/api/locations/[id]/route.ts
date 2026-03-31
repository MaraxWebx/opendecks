import { NextRequest, NextResponse } from "next/server";

import { deleteLocation, updateLocation } from "@/lib/data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const requiredFields = ["name", "address"];
  const missingField = requiredFields.find((field) => !body?.[field]);

  if (missingField) {
    return NextResponse.json({ error: `Campo obbligatorio mancante: ${missingField}` }, { status: 400 });
  }

  const location = await updateLocation(id, {
    name: body.name,
    address: body.address,
    socialLink: body.socialLink || "",
    phone: body.phone || "",
    description: body.description || ""
  });

  if (!location) {
    return NextResponse.json({ error: "Location non trovata." }, { status: 404 });
  }

  return NextResponse.json({ location });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await deleteLocation(id);

  if (result.blocked) {
    return NextResponse.json(
      { error: "Questa location è collegata a uno o più eventi e non può essere eliminata." },
      { status: 409 }
    );
  }

  if (!result.deleted) {
    return NextResponse.json({ error: "Location non trovata." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
