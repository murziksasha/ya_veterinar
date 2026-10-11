import { SESSION_COOKIE, type AuthUser } from "@vetsync/shared";
import { cookies } from "next/headers";

export async function currentUser(): Promise<AuthUser | undefined> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return undefined;
  }
  const api = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
  const response = await fetch(`${api}/auth/me`, {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return undefined;
  }
  return (await response.json()) as AuthUser;
}
