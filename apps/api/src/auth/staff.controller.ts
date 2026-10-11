import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthUser } from "@vetsync/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "./auth.guard";
import { hashPassword } from "./password";
import { CurrentUser } from "./current-user";
import { parseStaffBody, toAuthUser } from "./auth.service";

@Controller("staff")
@UseGuards(AuthGuard)
export class StaffController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() actor: AuthUser): Promise<AuthUser[]> {
    return this.prisma.withTenant(actor.tenantId, async (tx) => {
      const users = await tx.user.findMany({ orderBy: { createdAt: "asc" } });
      return users.map(toAuthUser);
    });
  }

  @Post()
  async create(@CurrentUser() actor: AuthUser, @Body() body: unknown): Promise<AuthUser> {
    if (actor.role !== "owner") {
      throw new ForbiddenException("owner_only");
    }
    const input = parseStaffBody(body);
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await this.prisma.withTenant(actor.tenantId, (tx) =>
        tx.user.create({
          data: {
            tenantId: actor.tenantId,
            email: input.email,
            name: input.name,
            role: input.role,
            passwordHash,
          },
        }),
      );
      return toAuthUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("email_taken");
      }
      throw error;
    }
  }

  @Delete(":id")
  async remove(@CurrentUser() actor: AuthUser, @Param("id") id: string): Promise<{ ok: true }> {
    if (actor.role !== "owner") {
      throw new ForbiddenException("owner_only");
    }
    if (actor.id === id) {
      throw new BadRequestException("cannot_remove_self");
    }
    await this.prisma.withTenant(actor.tenantId, async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) {
        throw new BadRequestException("not_found");
      }
      if (target.role === "owner") {
        const owners = await tx.user.count({ where: { role: "owner" } });
        if (owners <= 1) {
          throw new BadRequestException("last_owner");
        }
      }
      await tx.user.delete({ where: { id } });
    });
    return { ok: true };
  }
}
