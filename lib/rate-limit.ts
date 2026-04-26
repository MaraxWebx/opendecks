import { NextResponse } from "next/server";

type RateLimitWindow = {
  resetAt: number;
  count: number;
};

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
};

const rateLimitStore = new Map<string, RateLimitWindow>();

export function getClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function applyRateLimit({
  key,
  limit,
  windowMs,
  message,
}: RateLimitConfig) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return null;
}
