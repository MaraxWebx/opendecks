import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canAttemptMongo, getDatabase } from "@/lib/mongodb";

const ADMIN_COOKIE = "opendecks_admin_session";
const ADMIN_USERNAME_COOKIE = "opendecks_admin_username";
const ADMIN_DISPLAY_NAME_COOKIE = "opendecks_admin_display_name";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function getAdminSeedCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "opendecks123",
    name: process.env.ADMIN_NAME || "Admin"
  };
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyAdminCredentials(username: string, password: string) {
  if (!canAttemptMongo()) {
    const fallback = getAdminSeedCredentials();
    return username === fallback.username && password === fallback.password;
  }

  try {
    const db = await getDatabase();
    const adminUser = await db.collection("admin_users").findOne<{ username: string; passwordHash: string }>({
      username
    });

    if (!adminUser) {
      return false;
    }

    return adminUser.passwordHash === hashPassword(password);
  } catch {
    const fallback = getAdminSeedCredentials();
    return username === fallback.username && password === fallback.password;
  }
}

export async function getAdminDisplayName(username: string) {
  const fallback = getAdminSeedCredentials();

  if (!canAttemptMongo()) {
    return username === fallback.username ? fallback.name : username;
  }

  try {
    const db = await getDatabase();
    const adminUser = await db.collection("admin_users").findOne<{
      username: string;
      name?: string;
      displayName?: string;
      fullName?: string;
    }>({
      username
    });

    return (
      adminUser?.name ||
      adminUser?.displayName ||
      adminUser?.fullName ||
      (username === fallback.username ? fallback.name : username)
    );
  } catch {
    return username === fallback.username ? fallback.name : username;
  }
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "authenticated";
}

export async function requireAdminApiAuth() {
  const authenticated = await isAdminAuthenticated();

  if (authenticated) {
    return null;
  }

  return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
}

export async function getAuthenticatedAdminName() {
  const store = await cookies();
  const rawDisplayName = store.get(ADMIN_DISPLAY_NAME_COOKIE)?.value;

  if (rawDisplayName) {
    return decodeCookieValue(rawDisplayName);
  }

  const rawUsername = store.get(ADMIN_USERNAME_COOKIE)?.value;

  if (!rawUsername) {
    return getAdminSeedCredentials().name;
  }

  return getAdminDisplayName(decodeCookieValue(rawUsername));
}

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  store.set(ADMIN_USERNAME_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  store.set(ADMIN_DISPLAY_NAME_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
