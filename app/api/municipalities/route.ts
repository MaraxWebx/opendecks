import { NextRequest, NextResponse } from "next/server";

import {
  findItalianMunicipalityByLabel,
  searchItalianMunicipalities,
} from "@/lib/italian-municipalities";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const exact = request.nextUrl.searchParams.get("exact");

  if (exact === "1") {
    const municipality = findItalianMunicipalityByLabel(query);
    return NextResponse.json({ municipality });
  }

  const municipalities = searchItalianMunicipalities(query);

  return NextResponse.json({ municipalities });
}
