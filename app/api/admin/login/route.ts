import { NextRequest, NextResponse } from "next/server";

import {
  createAdminSession,
  getAdminDisplayName,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimitResponse = applyRateLimit({
    key: `admin-login:${ip}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
    message: "Troppi tentativi di login. Riprova tra qualche minuto.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 });
  }

  const valid = await verifyAdminCredentials(username, password);

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  const displayName = await getAdminDisplayName(username);
  createAdminSession(response, { username, displayName });

  return response;
}
