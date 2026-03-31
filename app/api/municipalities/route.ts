import { NextRequest, NextResponse } from "next/server";

import { searchItalianMunicipalities } from "@/lib/italian-municipalities";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const municipalities = searchItalianMunicipalities(query);

  return NextResponse.json({ municipalities });
}
