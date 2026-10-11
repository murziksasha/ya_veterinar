import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/auth/auth.service";
import { ClinicService } from "../src/clinic/clinic.service";
import { issueSession } from "../src/auth/session";
import { PrismaService } from "../src/prisma/prisma.service";
import { SESSION_COOKIE } from "@vetsync/shared";

type Agent = ReturnType<typeof request.agent>;

describe("clinic API", () => {
  let app: INestApplication;
  let stamp = "";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    stamp = `${Date.now()}`;
  });

  afterAll(async () => {
    await app.close();
  });

  function http(): Agent {
    return request(app.getHttpServer());
  }

  async function register(email: string, clinicName: string): Promise<string> {
    const response = await http().post("/auth/register").send({
      clinicName,
      name: "Owner",
      email,
      password: "password1",
    });
    expect(response.status).toBe(201);
    return response.get("set-cookie") as unknown as string;
  }

  it("serves every module and rejects bad clinic input", async () => {
    const health = await http().get("/health");
    expect(health.body.database).toBe("up");

    expect((await http().post("/auth/register").send({ email: "bad", password: "password1" })).status).toBe(400);
    expect((await http().post("/auth/register").send({
      clinicName: "Named",
      name: "",
      email: `empty-${stamp}@example.com`,
      password: "password1",
    })).status).toBe(400);
    expect((await http().post("/auth/register").send({
      clinicName: "",
      name: "Owner",
      email: `empty2-${stamp}@example.com`,
      password: "password1",
    })).status).toBe(400);
    const ownerEmail = `owner-${stamp}@example.com`;
    const cookie = await register(ownerEmail, "Green Clinic");
    expect((await http().post("/auth/register").send({
      clinicName: "Other",
      name: "Owner",
      email: ownerEmail,
      password: "password1",
    })).status).toBe(400);

    expect((await http().post("/auth/login").send({ email: ownerEmail, password: "wrong-password" })).status).toBe(401);
    expect((await http().post("/auth/login").send({ email: "missing@example.com", password: "password1" })).status).toBe(401);
    const loggedIn = await http().post("/auth/login").send({ email: ownerEmail, password: "password1" });
    expect(loggedIn.status).toBe(200);
    const session = loggedIn.get("set-cookie") as unknown as string;
    expect((await http().get("/auth/me").set("Cookie", session)).body.email).toBe(ownerEmail);
    expect((await http().post("/auth/logout")).status).toBe(200);
    expect((await http().get("/auth/me")).status).toBe(401);
    expect((await http().get("/auth/me").set("Cookie", `${SESSION_COOKIE}=bad.token`)).status).toBe(401);

    const me = await http().get("/auth/me").set("Cookie", session);
    const forged = issueSession("missing-user", me.body.tenantId);
    expect((await http().get("/auth/me").set("Cookie", `${SESSION_COOKIE}=${forged}`)).status).toBe(401);

    const authed = () => ({
      get: (url: string) => http().get(url).set("Cookie", session),
      post: (url: string) => http().post(url).set("Cookie", session),
      patch: (url: string) => http().patch(url).set("Cookie", session),
      delete: (url: string) => http().delete(url).set("Cookie", session),
    });
    expect((await authed().get("/plugins")).body.length).toBe(11);
    const sub = await authed().get("/billing/subscription");
    expect(sub.body.plan).toBe("trial");
    expect(sub.body.locked).toBe(false);
    const slug = sub.body.slug as string;

    expect((await authed().post("/clients").send({})).status).toBe(400);
    const client = await authed().post("/clients").send({ name: "Olena", phone: "050", email: "o@example.com", note: "n" });
    expect(client.status).toBe(201);
    expect((await authed().get("/clients")).body).toHaveLength(1);
    expect((await authed().get("/clients/missing")).status).toBe(400);
    expect((await authed().get(`/clients/${client.body.id}`)).body.name).toBe("Olena");

    expect((await authed().post("/patients").send({ clientId: "missing", name: "Rex", species: "dog" })).status).toBe(400);
    const patient = await authed().post("/patients").send({
      clientId: client.body.id,
      name: "Rex",
      species: "dog",
      breed: "mix",
      sex: "male",
      birthDate: "2020-01-01T00:00:00.000Z",
    });
    expect(patient.status).toBe(201);
    expect((await authed().get("/patients")).body).toHaveLength(1);
    expect((await authed().get("/patients/missing")).status).toBe(400);

    expect((await authed().post(`/patients/${patient.body.id}/records`).send({})).status).toBe(400);
    expect((await authed().post("/patients/missing/records").send({ complaint: "cough" })).status).toBe(400);
    expect((await authed().post(`/patients/${patient.body.id}/records`).send({
      complaint: "cough",
      findings: "clear",
      diagnosis: "ok",
      treatment: "rest",
    })).status).toBe(201);

    expect((await authed().post(`/patients/${patient.body.id}/vaccinations`).send({ vaccine: "rabies" })).status).toBe(400);
    expect((await authed().post(`/patients/${patient.body.id}/vaccinations`).send({
      vaccine: "rabies",
      givenAt: "2020-01-01T00:00:00.000Z",
      nextDueAt: "2020-02-01T00:00:00.000Z",
      batch: "b1",
    })).status).toBe(201);
    expect((await authed().get("/vaccinations/due")).body.length).toBeGreaterThan(0);

    expect((await authed().post("/appointments").send({
      patientId: patient.body.id,
      start: "2026-12-01T10:00:00.000Z",
      end: "2026-12-01T09:00:00.000Z",
    })).status).toBe(400);
    const visit = await authed().post("/appointments").send({
      patientId: patient.body.id,
      start: "2026-12-01T10:00:00.000Z",
      end: "2026-12-01T10:30:00.000Z",
      note: "check",
    });
    expect(visit.status).toBe(201);
    expect((await authed().get("/appointments")).body.length).toBeGreaterThan(0);
    expect((await authed().get("/appointments").query({ from: "2026-01-01T00:00:00.000Z", to: "2026-12-31T00:00:00.000Z" })).status).toBe(200);
    expect((await authed().get("/appointments").query({ from: "nope" })).status).toBe(400);
    expect((await authed().patch(`/appointments/${visit.body.id}`).send({ status: "later" })).status).toBe(400);
    expect((await authed().patch("/appointments/missing").send({ status: "done" })).status).toBe(400);
    expect((await authed().patch(`/appointments/${visit.body.id}`).send({ status: "done" })).body.status).toBe("done");

    expect((await authed().post("/inventory").send({ name: "", unit: "ml" })).status).toBe(400);
    const item = await authed().post("/inventory").send({ name: "Saline", unit: "ml", threshold: 2 });
    expect(item.status).toBe(201);
    const openItem = await authed().post("/inventory").send({ name: "Gauze", unit: "pack" });
    expect(openItem.status).toBe(201);
    expect((await authed().post(`/inventory/${item.body.id}/movements`).send({ delta: 0 })).status).toBe(400);
    expect((await authed().post("/inventory/missing/movements").send({ delta: 1 })).status).toBe(400);
    expect((await authed().post(`/inventory/${item.body.id}/movements`).send({ delta: -1 })).status).toBe(400);
    expect((await authed().post(`/inventory/${item.body.id}/movements`).send({ delta: 5, note: "in" })).status).toBe(201);
    expect((await authed().get("/inventory")).body.length).toBe(2);

    const before = await authed().get("/bi/overview");
    expect(before.body.revenueKop).toBe(0);
    expect(before.body.lowStock).toBeGreaterThan(0);

    expect((await authed().post("/invoices").send({ lines: [] })).status).toBe(400);
    const invoice = await authed().post("/invoices").send({
      lines: [{ description: "Visit", qty: 1, unitKop: 15000 }],
    });
    expect(invoice.status).toBe(201);
    const draft = await authed().post("/invoices").send({
      lines: [{ description: "Void me", qty: 2, unitKop: 100 }],
    });
    expect((await authed().post(`/invoices/${draft.body.id}/void`)).body.status).toBe("void");
    expect((await authed().post(`/invoices/${draft.body.id}/void`)).status).toBe(400);
    expect((await authed().post("/invoices/missing/void")).status).toBe(400);
    expect((await authed().post(`/invoices/${invoice.body.id}/pay`).send({ provider: "cash" })).status).toBe(400);
    expect((await authed().post("/invoices/missing/pay").send({ provider: "stripe" })).status).toBe(400);
    expect((await authed().post(`/invoices/${invoice.body.id}/fiscal`).send({ provider: "checkbox" })).status).toBe(400);
    const paid = await authed().post(`/invoices/${invoice.body.id}/pay`).send({ provider: "stripe" });
    expect(paid.body.invoice.status).toBe("paid");
    expect(paid.body.payment.payload).toContain("signature");
    expect((await authed().post(`/invoices/${invoice.body.id}/pay`).send({ provider: "liqpay" })).status).toBe(400);
    const receipt = await authed().post(`/invoices/${invoice.body.id}/fiscal`).send({ provider: "checkbox" });
    expect(receipt.body.status).toBe("posted");
    expect((await authed().post(`/invoices/${invoice.body.id}/fiscal`).send({ provider: "checkbox" })).status).toBe(400);
    expect((await authed().post(`/invoices/${invoice.body.id}/fiscal`).send({ provider: "nope" })).status).toBe(400);
    expect((await authed().post("/invoices/missing/fiscal").send({ provider: "checkbox" })).status).toBe(400);

    const second = await authed().post("/invoices").send({ lines: [{ description: "Lab", qty: 1, unitKop: 500 }] });
    await authed().post(`/invoices/${second.body.id}/pay`).send({ provider: "monobank" });
    expect((await authed().post(`/invoices/${second.body.id}/fiscal`).send({ provider: "prro_ua" })).body.provider).toBe("prro_ua");

    expect((await authed().post("/notifications").send({ channel: "fax", destination: "1", body: "hi" })).status).toBe(400);
    const note = await authed().post("/notifications").send({ channel: "telegram", destination: "1", body: "hi" });
    expect((await authed().post("/notifications/missing/dispatch")).status).toBe(400);
    expect((await authed().post(`/notifications/${note.body.id}/dispatch`)).body.status).toBe("sent");
    expect((await authed().post(`/notifications/${note.body.id}/dispatch`)).status).toBe(400);
    for (const channel of ["sms", "email", "push"]) {
      const created = await authed().post("/notifications").send({ channel, destination: "dest", body: "hi" });
      expect((await authed().post(`/notifications/${created.body.id}/dispatch`)).status).toBe(201);
    }
    expect((await authed().get("/notifications")).body.length).toBe(4);

    expect((await authed().post(`/patients/${patient.body.id}/studies`).send({ source: "hl7", title: "x" })).status).toBe(400);
    expect((await authed().post("/patients/missing/studies").send({ source: "manual", title: "scan" })).status).toBe(400);
    expect((await authed().post(`/patients/${patient.body.id}/studies`).send({
      source: "manual",
      title: "scan",
      fileName: "scan.dcm",
      modality: "CR",
    })).status).toBe(201);
    expect((await authed().post(`/patients/${patient.body.id}/studies`).send({
      source: "generic_analyzer",
      title: "blood",
      fileName: "blood.csv",
    })).status).toBe(201);
    expect((await authed().get(`/patients/${patient.body.id}`)).body.records).toHaveLength(1);

    const after = await authed().get("/bi/overview");
    expect(after.body.revenueKop).toBeGreaterThan(0);
    expect(after.body.clients).toBe(1);

    expect((await http().get("/public/clinics/missing-slug")).status).toBe(400);
    expect((await http().get(`/public/clinics/${slug}`)).body.slug).toBe(slug);
    expect((await http().post(`/public/clinics/${slug}/appointments`).send({
      ownerName: "Ihor",
      petName: "Mur",
      species: "cat",
      start: "2000-01-01T00:00:00.000Z",
    })).status).toBe(400);
    const booked = await http().post(`/public/clinics/${slug}/appointments`).send({
      ownerName: "Ihor",
      phone: "067",
      petName: "Mur",
      species: "cat",
      start: "2027-05-01T09:00:00.000Z",
      note: "public",
    });
    expect(booked.status).toBe(201);
    expect((await authed().get("/clients")).body.length).toBe(2);

    expect((await authed().post("/billing/subscription").send({ plan: "trial", provider: "stripe" })).status).toBe(400);
    const basic = await authed().post("/billing/subscription").send({ plan: "basic", provider: "liqpay" });
    expect(basic.body.invoice.status).toBe("paid");
    expect((await authed().get("/billing/subscription")).body.plan).toBe("basic");
    expect((await authed().post("/billing/subscription").send({ plan: "basic", provider: "stripe" })).status).toBe(400);
    expect((await authed().post("/billing/subscription").send({ plan: "pro", provider: "monobank" })).body.invoice.plan).toBe("pro");

    const assistant = await authed().post("/staff").send({
      name: "Assistant",
      email: `assistant-${stamp}@example.com`,
      password: "password1",
      role: "assistant",
    });
    expect(assistant.status).toBe(201);
    expect((await authed().post("/staff").send({
      name: "Dupe",
      email: `assistant-${stamp}@example.com`,
      password: "password1",
      role: "assistant",
    })).status).toBe(400);
    const assistantLogin = await http().post("/auth/login").send({
      email: `assistant-${stamp}@example.com`,
      password: "password1",
    });
    const assistantCookie = assistantLogin.get("set-cookie") as unknown as string;
    expect((await http().post("/staff").set("Cookie", assistantCookie).send({
      name: "Nope",
      email: `nope-${stamp}@example.com`,
      password: "password1",
      role: "veterinarian",
    })).status).toBe(403);
    expect((await http().delete(`/staff/${assistant.body.id}`).set("Cookie", assistantCookie)).status).toBe(403);
    expect((await authed().delete("/staff/missing")).status).toBe(400);
    expect((await authed().delete(`/staff/${me.body.id}`)).body.message).toBe("last_owner");
    expect((await authed().delete(`/staff/${assistant.body.id}`)).status).toBe(200);

    const owner2 = await authed().post("/staff").send({
      name: "Second",
      email: `owner2-${stamp}@example.com`,
      password: "password1",
      role: "owner",
    });
    const owner3 = await authed().post("/staff").send({
      name: "Third",
      email: `owner3-${stamp}@example.com`,
      password: "password1",
      role: "owner",
    });
    const owner3Login = await http().post("/auth/login").send({
      email: `owner3-${stamp}@example.com`,
      password: "password1",
    });
    expect((await http().delete(`/staff/${owner3.body.id}`).set("Cookie", owner3Login.get("set-cookie") as unknown as string)).body.message).toBe("cannot_remove_self");
    expect((await authed().delete(`/staff/${owner2.body.id}`)).status).toBe(200);
    expect((await authed().delete(`/staff/${owner3.body.id}`)).status).toBe(200);

    const lockedEmail = `locked-${stamp}@example.com`;
    const lockedCookie = await register(lockedEmail, "Locked Clinic");
    const lockedMe = await http().get("/auth/me").set("Cookie", lockedCookie);
    const prisma = app.get(PrismaService);
    await prisma.withTenant(lockedMe.body.tenantId, (tx) =>
      tx.tenant.update({ where: { id: lockedMe.body.tenantId }, data: { trialEndsAt: new Date(0) } }),
    );
    expect((await http().post("/clients").set("Cookie", lockedCookie).send({ name: "Blocked" })).status).toBe(400);
    expect((await http().get("/billing/subscription").set("Cookie", lockedCookie)).body.locked).toBe(true);
    expect((await http().post("/billing/subscription").set("Cookie", lockedCookie).send({
      plan: "basic",
      provider: "stripe",
    })).status).toBe(201);
    expect((await http().post("/clients").set("Cookie", lockedCookie).send({ name: "Open" })).status).toBe(201);

    await expect(app.get(AuthService).register(null)).rejects.toThrow("invalid_input");
    const clinic = app.get(ClinicService);
    const ghost = { id: "x", tenantId: "missing-tenant", email: "a@b.c", name: "n", role: "owner" as const };
    await expect(clinic.subscription(ghost)).rejects.toThrow("not_found");
    await expect(clinic.createClient(ghost, { name: "Ghost" })).rejects.toThrow("not_found");
    await expect(clinic.subscribe(ghost, { plan: "basic", provider: "stripe" })).rejects.toThrow("not_found");
    expect((await authed().get("/invoices")).body.length).toBeGreaterThan(0);
    expect((await authed().get("/staff")).body.length).toBe(1);
  });
});
