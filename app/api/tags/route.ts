import { NextRequest, NextResponse } from "next/server";

import { createTag, getTags } from "@/lib/data";

export async function GET() {
  const tags = await getTags();
  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const label = String(body?.label || "").trim();

  if (!label) {
    return NextResponse.json({ error: "Label tag mancante." }, { status: 400 });
  }

  const tag = await createTag({
    slug: createSlug(label),
    label
  });

  return NextResponse.json({ tag }, { status: 201 });
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
