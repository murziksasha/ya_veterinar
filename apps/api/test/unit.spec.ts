import { createHmac } from "crypto";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { SESSION_COOKIE } from "@vetsync/shared";
import { buildFiscal, buildNotification, buildPayment, buildStudy, listAdapters } from "../src/clinic/adapters";
import { optionalInt, parseDate, recordOf, requiredText, slugFor, text } from "../src/clinic/text";
import { parseCredentials, parseStaffBody, rethrowPrisma, toAuthUser } from "../src/auth/auth.service";
import { hashPassword, verifyPassword } from "../src/auth/password";
import {
  clearSessionCookie,
  issueSession,
  readSession,
  sessionCookieHeader,
  setSessionCookie,
} from "../src/auth/session";
import { PrismaService } from "../src/prisma/prisma.service";

function signed(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", process.env.SESSION_SECRET as string).update(body).digest("base64url");
  return `${body}.${mac}`;
}

describe("units", () => {
  it("covers passwords, sessions, parsers, adapters, and the database ping", async () => {
    const hash = await hashPassword("password1");
    expect(await verifyPassword("password1", hash)).toBe(true);
    expect(await verifyPassword("password2", hash)).toBe(false);
    expect(await verifyPassword("password1", "nope")).toBe(false);
    expect(await verifyPassword("password1", "scrypt$YQ==$YQ==")).toBe(false);

    const token = issueSession("user", "tenant");
    expect(readSession(token)?.sub).toBe("user");
    expect(readSession(undefined)).toBeUndefined();
    expect(readSession("nodot")).toBeUndefined();
    expect(readSession(`${token}x`)).toBeUndefined();
    expect(readSession(signed({ sub: "u", tenantId: "t", exp: 1 }))).toBeUndefined();
    expect(readSession(signed({ tenantId: "t", exp: 9999999999 }))).toBeUndefined();
    const badBody = Buffer.from("not-json").toString("base64url");
    const badMac = createHmac("sha256", process.env.SESSION_SECRET as string).update(badBody).digest("base64url");
    expect(readSession(`${badBody}.${badMac}`)).toBeUndefined();

    const saved = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    expect(() => issueSession("u", "t")).toThrow("SESSION_SECRET");
    process.env.SESSION_SECRET = saved;

    const headers: string[] = [];
    const res = { setHeader: (_name: string, value: string) => headers.push(value) };
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    setSessionCookie(res, "tok");
    process.env.NODE_ENV = "test";
    clearSessionCookie(res);
    process.env.NODE_ENV = previous;
    expect(headers[0]).toContain("Secure");
    expect(headers[1]).toContain("Max-Age=0");
    expect(sessionCookieHeader(undefined)).toBeUndefined();
    expect(sessionCookieHeader("a=b")).toBeUndefined();
    expect(sessionCookieHeader(`${SESSION_COOKIE}=abc`)).toBe("abc");

    expect(recordOf(null)).toEqual({});
    expect(recordOf({ a: 1 })).toEqual({ a: 1 });
    expect(text(1, 4)).toBe("");
    expect(text("  hello  ", 4)).toBe("hell");
    expect(() => requiredText("  ", 4)).toThrow(BadRequestException);
    expect(requiredText("ok", 4)).toBe("ok");
    expect(optionalInt("3", 1, 5)).toBe(3);
    expect(() => optionalInt(1.5, 0, 5)).toThrow(BadRequestException);
    expect(parseDate(undefined, false)).toBeNull();
    expect(parseDate("", false)).toBeNull();
    expect(() => parseDate(undefined, true)).toThrow(BadRequestException);
    expect(() => parseDate(4, false)).toThrow(BadRequestException);
    expect(() => parseDate("nope", true)).toThrow(BadRequestException);
    expect(parseDate("2026-01-02T00:00:00.000Z", true)?.toISOString()).toContain("2026");
    expect(slugFor("Клініка", "123456789")).toBe("clinic-12345678");
    expect(slugFor("Green Clinic", "abcdef123456")).toBe("green-clinic-abcdef12");

    for (const provider of ["stripe", "liqpay", "monobank"] as const) {
      const built = buildPayment(provider, { invoiceId: "inv", amountKop: 50000, description: "sale" });
      expect(built.status).toBe("paid");
      expect(built.payload.length).toBeGreaterThan(10);
    }
    expect(buildFiscal("checkbox", { invoiceId: "inv", totalKop: 10 }).status).toBe("posted");
    expect(buildFiscal("prro_ua", { invoiceId: "inv", totalKop: 10 }).provider).toBe("prro_ua");
    for (const channel of ["telegram", "sms", "email", "push"] as const) {
      expect(buildNotification(channel, { destination: "dest", body: "hi" }).status).toBe("sent");
    }
    expect(buildStudy("manual", { title: "x", fileName: "a.dcm" }).status).toBe("stored");
    expect(buildStudy("generic_analyzer", { title: "x", fileName: "" }).provider).toBe("generic_analyzer");
    expect(listAdapters()).toHaveLength(11);

    expect(() => parseCredentials(null)).toThrow(BadRequestException);
    expect(() => parseCredentials({ email: "a@b.c", password: "short" })).toThrow(BadRequestException);
    expect(() => parseCredentials({ email: "a@b.c", password: "x".repeat(201) })).toThrow(BadRequestException);
    expect(parseCredentials({ email: " A@B.C ", password: "password1" }).email).toBe("a@b.c");
    expect(() => parseStaffBody({ email: "a@b.c", password: "password1", name: "", role: "owner" })).toThrow(
      BadRequestException,
    );
    expect(() => parseStaffBody({ email: "a@b.c", password: "password1", name: "Vet", role: "nope" })).toThrow(
      BadRequestException,
    );
    expect(() => parseStaffBody(null)).toThrow(BadRequestException);
    expect(parseStaffBody({ email: "a@b.c", password: "password1", name: "Vet", role: "veterinarian" }).role).toBe(
      "veterinarian",
    );
    expect(() => toAuthUser({ id: "1", tenantId: "t", email: "a@b.c", name: "n", role: "nope" })).toThrow(
      UnauthorizedException,
    );
    expect(() => rethrowPrisma(new Error("boom"))).toThrow("boom");
    const previousStripe = process.env.STRIPE_SECRET;
    process.env.STRIPE_SECRET = "stripe-test";
    process.env.LIQPAY_PRIVATE_KEY = "liqpay-test";
    process.env.MONOBANK_TOKEN = "mono-test";
    expect(buildPayment("stripe", { invoiceId: "inv", amountKop: 1, description: "sale" }).payload).toContain("signature");
    delete process.env.STRIPE_SECRET;
    delete process.env.LIQPAY_PRIVATE_KEY;
    delete process.env.MONOBANK_TOKEN;
    if (previousStripe) {
      process.env.STRIPE_SECRET = previousStripe;
    }

    const prisma = new PrismaService();
    await prisma.onModuleInit();
    expect(await prisma.ping()).toBe("up");
    await prisma.onModuleDestroy();
    const down = new PrismaService();
    (down as unknown as { $queryRaw: () => Promise<unknown> }).$queryRaw = () => Promise.reject(new Error("down"));
    expect(await down.ping()).toBe("down");
  });
});
