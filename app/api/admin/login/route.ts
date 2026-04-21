import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_MAX_AGE,
  getAdminDisplayName,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "admin").trim() || "admin";
  const password = String(formData.get("password") || "opendecks123");

  const valid = await verifyAdminCredentials(username, password);

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  const displayName = await getAdminDisplayName(username);
  response.cookies.set("opendecks_admin_session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
  response.cookies.set("opendecks_admin_username", encodeURIComponent(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
  response.cookies.set("opendecks_admin_display_name", encodeURIComponent(displayName), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });

  return response;
}
