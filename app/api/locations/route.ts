import { NextRequest, NextResponse } from "next/server";

import { createLocation, getLocations } from "@/lib/data";

export async function GET() {
  const locations = await getLocations();
  return NextResponse.json({ locations });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const requiredFields = ["name", "address"];
  const missingField = requiredFields.find((field) => !body?.[field]);

  if (missingField) {
    return NextResponse.json({ error: `Campo obbligatorio mancante: ${missingField}` }, { status: 400 });
  }

  const location = await createLocation({
    name: body.name,
    address: body.address,
    socialLink: body.socialLink || "",
    phone: body.phone || "",
    description: body.description || ""
  });

  return NextResponse.json({ location }, { status: 201 });
}
