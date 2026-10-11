import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_COOKIE } from "@vetsync/shared";

type CookieResponse = {
  setHeader(name: string, value: string): void;
};

const TTL_SECONDS = 60 * 60 * 24 * 14;

export type SessionClaims = {
  sub: string;
  tenantId: string;
  exp: number;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is required");
  }
  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function issueSession(userId: string, tenantId: string): string {
  const body = Buffer.from(
    JSON.stringify({ sub: userId, tenantId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSession(token: string | undefined): SessionClaims | undefined {
  if (!token) {
    return undefined;
  }
  const dot = token.lastIndexOf(".");
  if (dot <= 0) {
    return undefined;
  }
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  const actualBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionClaims;
    if (!parsed.sub || !parsed.tenantId || parsed.exp * 1000 < Date.now()) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function sessionCookieHeader(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      return rest.join("=");
    }
  }
  return undefined;
}

function cookie(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(res: CookieResponse, token: string): void {
  res.setHeader("Set-Cookie", cookie(token, TTL_SECONDS));
}

export function clearSessionCookie(res: CookieResponse): void {
  res.setHeader("Set-Cookie", cookie("", 0));
}
