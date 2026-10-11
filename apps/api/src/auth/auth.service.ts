import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthUser, StaffRole } from "@vetsync/shared";
import { isStaffRole } from "@vetsync/shared";
import { Prisma, type StaffRole as PrismaStaffRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { slugFor } from "../clinic/text";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./password";

type LoginRow = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: PrismaStaffRole;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseCredentials(body: unknown): { email: string; password: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = clean(record.email, 200).toLowerCase();
  const password = typeof record.password === "string" ? record.password : "";
  if (!EMAIL.test(email) || password.length < 8 || password.length > 200) {
    throw new BadRequestException("invalid_input");
  }
  return { email, password };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: unknown): Promise<AuthUser> {
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const clinicName = clean(record.clinicName, 120);
    const name = clean(record.name, 120);
    const { email, password } = parseCredentials(body);
    if (!clinicName || !name) {
      throw new BadRequestException("invalid_input");
    }

    const tenantId = randomUUID();
    const passwordHash = await hashPassword(password);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.tenant.create({
          data: { id: tenantId, name: clinicName, slug: slugFor(clinicName, tenantId), trialEndsAt },
        });
        return tx.user.create({
          data: { tenantId, email, name, passwordHash, role: "owner" },
        });
      });
      return toAuthUser(user);
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async login(body: unknown): Promise<AuthUser> {
    const { email, password } = parseCredentials(body);
    const rows = await this.prisma.$queryRaw<LoginRow[]>`
      SELECT id, "tenantId", email, name, "passwordHash", role
      FROM auth_find_user_by_email(${email})
    `;
    const row = rows[0];
    const ok = await verifyPassword(password, row?.passwordHash ?? "scrypt$invalid$invalid");
    if (!row || !ok) {
      throw new UnauthorizedException("invalid_credentials");
    }
    return toAuthUser(row);
  }

  async me(tenantId: string, userId: string): Promise<AuthUser> {
    const user = await this.prisma.withTenant(tenantId, (tx) =>
      tx.user.findUnique({ where: { id: userId } }),
    );
    if (!user) {
      throw new UnauthorizedException("invalid_credentials");
    }
    return toAuthUser(user);
  }
}

export function rethrowPrisma(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new BadRequestException("email_taken");
  }
  throw error;
}

export function toAuthUser(user: {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}): AuthUser {
  if (!isStaffRole(user.role)) {
    throw new UnauthorizedException("invalid_credentials");
  }
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function parseStaffBody(body: unknown): {
  email: string;
  password: string;
  name: string;
  role: StaffRole;
} {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = clean(record.name, 120);
  const role = clean(record.role, 40);
  const { email, password } = parseCredentials(body);
  if (!name || !isStaffRole(role)) {
    throw new BadRequestException("invalid_input");
  }
  return { email, password, name, role };
}
