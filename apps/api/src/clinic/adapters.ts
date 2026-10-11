import { createHash, createHmac, randomUUID } from "crypto";
import {
  DIAGNOSTIC_SOURCES,
  FISCAL_PROVIDERS,
  NOTIFY_CHANNELS,
  PAYMENT_PROVIDERS,
  type DiagnosticSource,
  type FiscalProviderId,
  type NotifyChannel,
  type PaymentProviderId,
} from "@vetsync/shared";

export type AdapterKind = "payment" | "fiscal" | "notify" | "diagnostic";

export type PaymentRequest = {
  invoiceId: string;
  amountKop: number;
  description: string;
};

export type BuiltPayload = {
  provider: string;
  externalId: string;
  payload: string;
  status: string;
};

function secret(name: string): string {
  return process.env[name] || "local-dev";
}

function pack(provider: string, body: unknown, status: string): BuiltPayload {
  return {
    provider,
    externalId: `${provider}_${randomUUID()}`,
    payload: JSON.stringify(body),
    status,
  };
}

/** Local transport. Payloads match the provider shape. No outbound HTTP. */
export function buildPayment(provider: PaymentProviderId, input: PaymentRequest): BuiltPayload {
  if (provider === "stripe") {
    const body = {
      amount: input.amountKop,
      currency: "uah",
      metadata: { invoiceId: input.invoiceId },
    };
    const signature = createHmac("sha256", secret("STRIPE_SECRET")).update(JSON.stringify(body)).digest("hex");
    return pack(provider, { ...body, signature }, "paid");
  }
  if (provider === "liqpay") {
    const data = Buffer.from(
      JSON.stringify({
        version: 3,
        action: "pay",
        amount: input.amountKop / 100,
        currency: "UAH",
        description: input.description,
        order_id: input.invoiceId,
      }),
    ).toString("base64");
    const privateKey = secret("LIQPAY_PRIVATE_KEY");
    const signature = createHash("sha1").update(privateKey + data + privateKey).digest("base64");
    return pack(provider, { data, signature }, "paid");
  }
  const body = { amount: input.amountKop, ccy: 980, reference: input.invoiceId };
  const signature = createHmac("sha256", secret("MONOBANK_TOKEN")).update(JSON.stringify(body)).digest("hex");
  return pack(provider, { ...body, signature }, "paid");
}

export function buildFiscal(
  provider: FiscalProviderId,
  input: { invoiceId: string; totalKop: number },
): BuiltPayload {
  if (provider === "checkbox") {
    return pack(provider, { goods: [{ good: { name: "VetSync" }, quantity: 1000, price: input.totalKop }], payment: { type: "CASHLESS", value: input.totalKop } }, "posted");
  }
  return pack(provider, { receipt: { id: input.invoiceId, sum: input.totalKop, tax: "no_vat" } }, "posted");
}

export function buildNotification(
  channel: NotifyChannel,
  input: { destination: string; body: string },
): BuiltPayload {
  if (channel === "telegram") {
    return pack(channel, { chat_id: input.destination, text: input.body }, "sent");
  }
  if (channel === "sms") {
    return pack(channel, { sender: "VetSync", recipients: [input.destination], text: input.body }, "sent");
  }
  if (channel === "email") {
    return pack(channel, { to: input.destination, subject: "VetSync", text: input.body }, "sent");
  }
  return pack(channel, { endpoint: input.destination, title: "VetSync", body: input.body }, "sent");
}

export function buildStudy(
  source: DiagnosticSource,
  input: { title: string; fileName: string },
): BuiltPayload {
  if (source === "manual") {
    return pack(source, { fileName: input.fileName, title: input.title, storage: "local" }, "stored");
  }
  return pack(source, { device: "generic_analyzer", sample: input.title, fileName: input.fileName }, "stored");
}

export function listAdapters(): Array<{ kind: AdapterKind; id: string }> {
  return [
    ...PAYMENT_PROVIDERS.map((id) => ({ kind: "payment" as const, id })),
    ...FISCAL_PROVIDERS.map((id) => ({ kind: "fiscal" as const, id })),
    ...NOTIFY_CHANNELS.map((id) => ({ kind: "notify" as const, id })),
    ...DIAGNOSTIC_SOURCES.map((id) => ({ kind: "diagnostic" as const, id })),
  ];
}
