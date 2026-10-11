import { BadRequestException, Injectable } from "@nestjs/common";
import type { AuthUser } from "@vetsync/shared";
import {
  DIAGNOSTIC_SOURCES,
  FISCAL_PROVIDERS,
  NOTIFY_CHANNELS,
  PAYMENT_PROVIDERS,
  PLAN_PRICE_KOP,
  isOneOf,
  type ClinicPlan,
  type DiagnosticSource,
  type FiscalProviderId,
  type NotifyChannel,
  type PaymentProviderId,
} from "@vetsync/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildFiscal, buildNotification, buildPayment, buildStudy, listAdapters } from "./adapters";
import { optionalInt, parseDate, recordOf, requiredText, text } from "./text";

type Tx = Prisma.TransactionClient;

@Injectable()
export class ClinicService {
  constructor(private readonly prisma: PrismaService) {}

  private run<T>(actor: AuthUser, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.withTenant(actor.tenantId, async (tx) => {
      await this.assertActive(tx, actor.tenantId);
      return fn(tx);
    });
  }

  private async assertActive(tx: Tx, tenantId: string): Promise<void> {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException("not_found");
    }
    if (tenant.plan === "trial" && tenant.trialEndsAt.getTime() < Date.now()) {
      throw new BadRequestException("subscription_inactive");
    }
  }

  plugins(): ReturnType<typeof listAdapters> {
    return listAdapters();
  }

  subscription(actor: AuthUser) {
    return this.prisma.withTenant(actor.tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: actor.tenantId } });
      if (!tenant) {
        throw new BadRequestException("not_found");
      }
      const locked = tenant.plan === "trial" && tenant.trialEndsAt.getTime() < Date.now();
      return {
        plan: tenant.plan,
        slug: tenant.slug,
        trialEndsAt: tenant.trialEndsAt.toISOString(),
        locked,
        pricesKop: PLAN_PRICE_KOP,
      };
    });
  }

  listClients(actor: AuthUser) {
    return this.run(actor, (tx) => tx.client.findMany({ orderBy: { createdAt: "asc" }, include: { patients: true } }));
  }

  createClient(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    const name = requiredText(input.name, 120);
    return this.run(actor, (tx) =>
      tx.client.create({
        data: {
          tenantId: actor.tenantId,
          name,
          phone: text(input.phone, 40),
          email: text(input.email, 200),
          note: text(input.note, 500),
        },
      }),
    );
  }

  async getClient(actor: AuthUser, id: string) {
    const row = await this.run(actor, (tx) =>
      tx.client.findUnique({ where: { id }, include: { patients: true } }),
    );
    if (!row) {
      throw new BadRequestException("not_found");
    }
    return row;
  }

  listPatients(actor: AuthUser) {
    return this.run(actor, (tx) => tx.patient.findMany({ orderBy: { createdAt: "asc" } }));
  }

  async createPatient(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    const clientId = requiredText(input.clientId, 40);
    const name = requiredText(input.name, 120);
    const species = requiredText(input.species, 80);
    const birthDate = parseDate(input.birthDate, false);
    return this.run(actor, async (tx) => {
      const client = await tx.client.findUnique({ where: { id: clientId } });
      if (!client) {
        throw new BadRequestException("not_found");
      }
      return tx.patient.create({
        data: {
          tenantId: actor.tenantId,
          clientId,
          name,
          species,
          breed: text(input.breed, 80),
          sex: text(input.sex, 20),
          birthDate,
        },
      });
    });
  }

  async getPatient(actor: AuthUser, id: string) {
    const row = await this.run(actor, (tx) =>
      tx.patient.findUnique({
        where: { id },
        include: { records: true, vaccines: true, studies: true, visits: true },
      }),
    );
    if (!row) {
      throw new BadRequestException("not_found");
    }
    return row;
  }

  async addRecord(actor: AuthUser, patientId: string, body: unknown) {
    const input = recordOf(body);
    const complaint = requiredText(input.complaint, 500);
    return this.run(actor, async (tx) => {
      await this.requirePatient(tx, patientId);
      return tx.medicalRecord.create({
        data: {
          tenantId: actor.tenantId,
          patientId,
          authorId: actor.id,
          complaint,
          findings: text(input.findings, 2000),
          diagnosis: text(input.diagnosis, 500),
          treatment: text(input.treatment, 2000),
        },
      });
    });
  }

  async addVaccination(actor: AuthUser, patientId: string, body: unknown) {
    const input = recordOf(body);
    const vaccine = requiredText(input.vaccine, 120);
    const givenAt = parseDate(input.givenAt, true);
    const nextDueAt = parseDate(input.nextDueAt, false);
    return this.run(actor, async (tx) => {
      await this.requirePatient(tx, patientId);
      return tx.vaccination.create({
        data: {
          tenantId: actor.tenantId,
          patientId,
          authorId: actor.id,
          vaccine,
          givenAt: givenAt as Date,
          nextDueAt,
          batch: text(input.batch, 80),
        },
      });
    });
  }

  dueVaccinations(actor: AuthUser) {
    const now = new Date();
    return this.run(actor, (tx) =>
      tx.vaccination.findMany({
        where: { nextDueAt: { lte: now } },
        orderBy: { nextDueAt: "asc" },
      }),
    );
  }

  async createAppointment(actor: AuthUser, body: unknown) {
    const input = this.appointmentInput(body);
    return this.run(actor, async (tx) => {
      await this.requirePatient(tx, input.patientId);
      return tx.appointment.create({
        data: {
          tenantId: actor.tenantId,
          patientId: input.patientId,
          staffId: actor.id,
          start: input.start,
          end: input.end,
          note: input.note,
          source: "clinic",
        },
      });
    });
  }

  listAppointments(actor: AuthUser, fromRaw: unknown, toRaw: unknown) {
    const from = parseDate(fromRaw, false);
    const to = parseDate(toRaw, false);
    return this.run(actor, (tx) =>
      tx.appointment.findMany({
        where: {
          start: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        },
        orderBy: { start: "asc" },
      }),
    );
  }

  async updateAppointment(actor: AuthUser, id: string, body: unknown) {
    const input = recordOf(body);
    const status = requiredText(input.status, 20);
    if (status !== "scheduled" && status !== "done" && status !== "cancelled") {
      throw new BadRequestException("invalid_input");
    }
    return this.run(actor, async (tx) => {
      const row = await tx.appointment.findUnique({ where: { id } });
      if (!row) {
        throw new BadRequestException("not_found");
      }
      return tx.appointment.update({ where: { id }, data: { status } });
    });
  }

  listItems(actor: AuthUser) {
    return this.run(actor, (tx) => tx.inventoryItem.findMany({ orderBy: { name: "asc" } }));
  }

  createItem(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    return this.run(actor, (tx) =>
      tx.inventoryItem.create({
        data: {
          tenantId: actor.tenantId,
          name: requiredText(input.name, 120),
          unit: requiredText(input.unit, 20),
          threshold: optionalInt(input.threshold ?? 0, 0, 1_000_000),
        },
      }),
    );
  }

  async moveStock(actor: AuthUser, itemId: string, body: unknown) {
    const input = recordOf(body);
    const delta = optionalInt(input.delta, -1_000_000, 1_000_000);
    if (delta === 0) {
      throw new BadRequestException("invalid_input");
    }
    const note = text(input.note, 300);
    return this.run(actor, async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new BadRequestException("not_found");
      }
      const quantity = item.quantity + delta;
      if (quantity < 0) {
        throw new BadRequestException("insufficient_stock");
      }
      const saved = await tx.inventoryItem.update({ where: { id: itemId }, data: { quantity } });
      const movement = await tx.stockMovement.create({
        data: { tenantId: actor.tenantId, itemId, delta, note, authorId: actor.id },
      });
      return { item: saved, movement };
    });
  }

  listInvoices(actor: AuthUser) {
    return this.prisma.withTenant(actor.tenantId, (tx) =>
      tx.invoice.findMany({ orderBy: { createdAt: "asc" }, include: { lines: true, payments: true, receipts: true } }),
    );
  }

  async createInvoice(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    const lines = Array.isArray(input.lines) ? input.lines : [];
    if (lines.length === 0) {
      throw new BadRequestException("invalid_input");
    }
    const parsed = lines.map((line) => {
      const row = recordOf(line);
      return {
        description: requiredText(row.description, 200),
        qty: optionalInt(row.qty, 1, 10_000),
        unitKop: optionalInt(row.unitKop, 0, 100_000_000),
      };
    });
    const totalKop = parsed.reduce((sum, line) => sum + line.qty * line.unitKop, 0);
    return this.run(actor, (tx) =>
      tx.invoice.create({
        data: {
          tenantId: actor.tenantId,
          kind: "sale",
          totalKop,
          lines: { create: parsed.map((line) => ({ ...line, tenantId: actor.tenantId })) },
        },
        include: { lines: true },
      }),
    );
  }

  async subscribe(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    const plan = requiredText(input.plan, 20);
    if (plan !== "basic" && plan !== "pro") {
      throw new BadRequestException("invalid_input");
    }
    const provider = this.paymentProvider(input.provider);
    return this.prisma.withTenant(actor.tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: actor.tenantId } });
      if (!tenant) {
        throw new BadRequestException("not_found");
      }
      if (tenant.plan === plan) {
        throw new BadRequestException("already_on_plan");
      }
      const totalKop = PLAN_PRICE_KOP[plan];
      const invoice = await tx.invoice.create({
        data: {
          tenantId: actor.tenantId,
          kind: "subscription",
          plan,
          totalKop,
          lines: {
            create: [{ tenantId: actor.tenantId, description: `VetSync ${plan}`, qty: 1, unitKop: totalKop }],
          },
        },
      });
      return this.payInvoice(tx, actor, invoice.id, provider);
    });
  }

  async pay(actor: AuthUser, invoiceId: string, body: unknown) {
    const provider = this.paymentProvider(recordOf(body).provider);
    return this.prisma.withTenant(actor.tenantId, (tx) => this.payInvoice(tx, actor, invoiceId, provider));
  }

  async voidInvoice(actor: AuthUser, invoiceId: string) {
    return this.run(actor, async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        throw new BadRequestException("not_found");
      }
      if (invoice.status !== "draft") {
        throw new BadRequestException("invoice_state");
      }
      return tx.invoice.update({ where: { id: invoiceId }, data: { status: "void" } });
    });
  }

  async fiscalize(actor: AuthUser, invoiceId: string, body: unknown) {
    const provider = requiredText(recordOf(body).provider, 20);
    if (!isOneOf(FISCAL_PROVIDERS, provider)) {
      throw new BadRequestException("unknown_adapter");
    }
    return this.run(actor, (tx) => this.fiscalizeTx(tx, actor, invoiceId, provider));
  }

  listNotifications(actor: AuthUser) {
    return this.run(actor, (tx) => tx.notificationMessage.findMany({ orderBy: { createdAt: "asc" } }));
  }

  createNotification(actor: AuthUser, body: unknown) {
    const input = recordOf(body);
    const channel = requiredText(input.channel, 20);
    if (!isOneOf(NOTIFY_CHANNELS, channel)) {
      throw new BadRequestException("unknown_adapter");
    }
    return this.run(actor, (tx) =>
      tx.notificationMessage.create({
        data: {
          tenantId: actor.tenantId,
          channel,
          destination: requiredText(input.destination, 200),
          body: requiredText(input.body, 1000),
        },
      }),
    );
  }

  async dispatchNotification(actor: AuthUser, id: string) {
    return this.run(actor, async (tx) => {
      const row = await tx.notificationMessage.findUnique({ where: { id } });
      if (!row) {
        throw new BadRequestException("not_found");
      }
      if (row.status !== "queued") {
        throw new BadRequestException("already_sent");
      }
      const built = buildNotification(row.channel, { destination: row.destination, body: row.body });
      return tx.notificationMessage.update({
        where: { id },
        data: { status: built.status, payload: built.payload },
      });
    });
  }

  async addStudy(actor: AuthUser, patientId: string, body: unknown) {
    const input = recordOf(body);
    const source = requiredText(input.source, 40);
    if (!isOneOf(DIAGNOSTIC_SOURCES, source)) {
      throw new BadRequestException("unknown_adapter");
    }
    const title = requiredText(input.title, 160);
    const fileName = text(input.fileName, 200);
    return this.run(actor, async (tx) => {
      await this.requirePatient(tx, patientId);
      const built = buildStudy(source, { title, fileName });
      return tx.diagnosticStudy.create({
        data: {
          tenantId: actor.tenantId,
          patientId,
          source,
          title,
          modality: text(input.modality, 80),
          fileName,
          storageKey: built.externalId,
          payload: built.payload,
          status: built.status,
        },
      });
    });
  }

  async overview(actor: AuthUser) {
    return this.run(actor, async (tx) => {
      const [clients, patients, due, paid, scheduled, items] = await Promise.all([
        tx.client.count(),
        tx.patient.count(),
        tx.vaccination.count({ where: { nextDueAt: { lte: new Date() } } }),
        tx.invoice.aggregate({ where: { status: "paid" }, _sum: { totalKop: true } }),
        tx.appointment.count({ where: { status: "scheduled" } }),
        tx.inventoryItem.findMany(),
      ]);
      return {
        clients,
        patients,
        lowStock: items.filter((item) => item.quantity <= item.threshold).length,
        dueVaccinations: due,
        revenueKop: paid._sum.totalKop ?? 0,
        scheduled,
      };
    });
  }

  async publicClinic(slug: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string; slug: string; plan: ClinicPlan }>>`
      SELECT id, name, slug, plan::text AS plan FROM public_clinic_by_slug(${slug})
    `;
    const row = rows[0];
    if (!row) {
      throw new BadRequestException("not_found");
    }
    return { id: row.id, name: row.name, slug: row.slug, plan: row.plan };
  }

  async publicBook(slug: string, body: unknown) {
    const clinic = await this.publicClinic(slug);
    const input = recordOf(body);
    const ownerName = requiredText(input.ownerName, 120);
    const petName = requiredText(input.petName, 120);
    const species = requiredText(input.species, 80);
    const start = parseDate(input.start, true) as Date;
    if (start.getTime() < Date.now() - 60_000) {
      throw new BadRequestException("invalid_input");
    }
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return this.prisma.withTenant(clinic.id, async (tx) => {
      const client = await tx.client.create({
        data: {
          tenantId: clinic.id,
          name: ownerName,
          phone: text(input.phone, 40),
        },
      });
      const patient = await tx.patient.create({
        data: { tenantId: clinic.id, clientId: client.id, name: petName, species },
      });
      const appointment = await tx.appointment.create({
        data: {
          tenantId: clinic.id,
          patientId: patient.id,
          start,
          end,
          note: text(input.note, 300),
          source: "public",
        },
      });
      return { client, patient, appointment };
    });
  }

  private appointmentInput(body: unknown): { patientId: string; start: Date; end: Date; note: string } {
    const input = recordOf(body);
    const start = parseDate(input.start, true) as Date;
    const end = parseDate(input.end, true) as Date;
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException("invalid_input");
    }
    return {
      patientId: requiredText(input.patientId, 40),
      start,
      end,
      note: text(input.note, 300),
    };
  }

  private paymentProvider(value: unknown): PaymentProviderId {
    const provider = requiredText(value, 20);
    if (!isOneOf(PAYMENT_PROVIDERS, provider)) {
      throw new BadRequestException("unknown_adapter");
    }
    return provider;
  }

  private async requirePatient(tx: Tx, id: string): Promise<void> {
    const patient = await tx.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new BadRequestException("not_found");
    }
  }

  private async payInvoice(tx: Tx, actor: AuthUser, invoiceId: string, provider: PaymentProviderId) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.tenantId !== actor.tenantId) {
      throw new BadRequestException("not_found");
    }
    if (invoice.status !== "draft") {
      throw new BadRequestException("invoice_state");
    }
    const built = buildPayment(provider, {
      invoiceId,
      amountKop: invoice.totalKop,
      description: invoice.kind,
    });
    const payment = await tx.payment.create({
      data: {
        tenantId: actor.tenantId,
        invoiceId,
        provider,
        externalId: built.externalId,
        payload: built.payload,
        status: built.status,
      },
    });
    const saved = await tx.invoice.update({ where: { id: invoiceId }, data: { status: "paid" } });
    if (invoice.kind === "subscription" && invoice.plan) {
      await tx.tenant.update({
        where: { id: actor.tenantId },
        data: { plan: invoice.plan, trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
    return { invoice: saved, payment };
  }

  private async fiscalizeTx(tx: Tx, actor: AuthUser, invoiceId: string, provider: FiscalProviderId) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { receipts: true } });
    if (!invoice) {
      throw new BadRequestException("not_found");
    }
    if (invoice.status !== "paid") {
      throw new BadRequestException("invoice_state");
    }
    if (invoice.receipts.length > 0) {
      throw new BadRequestException("already_fiscalized");
    }
    const built = buildFiscal(provider, { invoiceId, totalKop: invoice.totalKop });
    return tx.fiscalReceipt.create({
      data: {
        tenantId: actor.tenantId,
        invoiceId,
        provider,
        externalId: built.externalId,
        payload: built.payload,
        status: built.status,
      },
    });
  }
}
