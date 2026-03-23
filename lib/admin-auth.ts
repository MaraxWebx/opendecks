import { createHash } from "node:crypto";

import { cookies } from "next/headers";

import { canAttemptMongo, getDatabase } from "@/lib/mongodb";

const ADMIN_COOKIE = "opendecks_admin_session";

export function getAdminSeedCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "opendecks123"
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

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "authenticated";
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
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
}
