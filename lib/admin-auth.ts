import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canAttemptMongo, getDatabase } from "@/lib/mongodb";

const ADMIN_COOKIE = "opendecks_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type AdminSessionPayload = {
  username: string;
  displayName: string;
  expiresAt: number;
};

type AdminSeedCredentials = {
  username: string;
  password: string;
  name: string;
};

function getOptionalAdminSeedCredentials(): AdminSeedCredentials | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    name: process.env.ADMIN_NAME?.trim() || username,
  };
}

export function getAdminSeedCredentials() {
  const credentials = getOptionalAdminSeedCredentials();

  if (!credentials) {
    throw new Error(
      "Configura ADMIN_USERNAME e ADMIN_PASSWORD per l'accesso admin.",
    );
  }

  return credentials;
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function hashPasswordSecure(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPasswordHash(password: string, hash: string) {
  if (hash.startsWith("scrypt:")) {
    const [, salt, derivedKey] = hash.split(":");

    if (!salt || !derivedKey) {
      return false;
    }

    const nextDerivedKey = scryptSync(password, salt, 64).toString("hex");

    try {
      return timingSafeEqual(
        Buffer.from(derivedKey, "hex"),
        Buffer.from(nextDerivedKey, "hex"),
      );
    } catch {
      return false;
    }
  }

  return hash === hashPassword(password);
}

function needsPasswordRehash(hash: string) {
  return !hash.startsWith("scrypt:");
}

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "opendecks-dev-admin-session-secret";
  }

  throw new Error("Configura ADMIN_SESSION_SECRET per firmare la sessione admin.");
}

function encodeSessionPayload(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signSessionPayload(encodedPayload: string) {
  return createHmac("sha256", getAdminSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function buildSignedSessionToken(payload: AdminSessionPayload) {
  const encodedPayload = encodeSessionPayload(payload);
  const signature = signSessionPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseSignedSessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);

  try {
    if (
      !timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    if (
      !payload?.username ||
      !payload?.displayName ||
      !payload?.expiresAt ||
      payload.expiresAt < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function verifyAdminCredentials(username: string, password: string) {
  if (!canAttemptMongo()) {
    return false;
  }

  try {
    const db = await getDatabase();
    const adminUser = await db.collection("admin_users").findOne<{
      username: string;
      passwordHash: string;
    }>({
      username,
    });

    if (!adminUser) {
      return false;
    }

    const isValid = verifyPasswordHash(password, adminUser.passwordHash);

    if (isValid && needsPasswordRehash(adminUser.passwordHash)) {
      await db.collection("admin_users").updateOne(
        { username },
        { $set: { passwordHash: hashPasswordSecure(password) } },
      );
    }

    return isValid;
  } catch {
    return false;
  }
}

export async function getAdminDisplayName(username: string) {
  const configuredAdmin = getOptionalAdminSeedCredentials();

  if (!canAttemptMongo()) {
    return configuredAdmin?.username === username
      ? configuredAdmin.name
      : username;
  }

  try {
    const db = await getDatabase();
    const adminUser = await db.collection("admin_users").findOne<{
      username: string;
      name?: string;
      displayName?: string;
      fullName?: string;
    }>({
      username,
    });

    return (
      adminUser?.name ||
      adminUser?.displayName ||
      adminUser?.fullName ||
      (configuredAdmin?.username === username ? configuredAdmin.name : username)
    );
  } catch {
    return configuredAdmin?.username === username
      ? configuredAdmin.name
      : username;
  }
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return Boolean(parseSignedSessionToken(store.get(ADMIN_COOKIE)?.value));
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
  const session = parseSignedSessionToken(store.get(ADMIN_COOKIE)?.value);

  if (!session) {
    return "Admin";
  }

  return session.displayName || getAdminDisplayName(session.username);
}

export function createAdminSession(
  response: NextResponse,
  input: { username: string; displayName: string },
) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const token = buildSignedSessionToken({
    username: input.username,
    displayName: input.displayName,
    expiresAt,
  });

  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
