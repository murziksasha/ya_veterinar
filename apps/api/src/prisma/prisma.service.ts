import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** SELECT 1. Does not touch tenant tables, so RLS does not apply. */
  async ping(): Promise<"up" | "down"> {
    try {
      await this.$queryRaw`SELECT 1`;
      return "up";
    } catch {
      return "down";
    }
  }

  /**
   * Run `fn` in a transaction with `app.tenant_id` set for PostgreSQL RLS.
   * set_config(..., true) is local to this transaction.
   */
  async withTenant<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
