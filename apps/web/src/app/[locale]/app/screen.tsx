"use client";

import type { Locale } from "@vetsync/shared";
import { useEffect, useState, type FormEvent } from "react";
import { t, type MessageKey } from "@/i18n/messages";

type Screen =
  | "clients"
  | "patients"
  | "calendar"
  | "inventory"
  | "vaccinations"
  | "billing"
  | "notifications"
  | "reports"
  | "staff"
  | "patient";

async function api(path: string, body?: unknown, method?: string): Promise<unknown> {
  const response = await fetch(`/v1${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    credentials: "include",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "invalid_input");
  }
  return payload;
}

export function ClinicScreen({
  locale,
  screen,
  patientId,
}: {
  locale: Locale;
  screen: Screen;
  patientId?: string;
}) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | undefined>();

  async function reload() {
    const path =
      screen === "clients"
        ? "/clients"
        : screen === "patients"
          ? "/patients"
          : screen === "calendar"
            ? "/appointments"
            : screen === "inventory"
              ? "/inventory"
              : screen === "vaccinations"
                ? "/vaccinations/due"
                : screen === "billing"
                  ? "/billing/subscription"
                  : screen === "notifications"
                    ? "/notifications"
                    : screen === "reports"
                      ? "/bi/overview"
                      : screen === "staff"
                        ? "/staff"
                        : `/patients/${patientId}`;
    setData(await api(path));
  }

  useEffect(() => {
    void reload().catch((reason: Error) => setError(reason.message));
  }, [screen, patientId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "");
    setError(undefined);
    try {
      if (screen === "clients") {
        await api("/clients", { name: value("name"), phone: value("phone"), email: value("email"), note: value("note") });
      } else if (screen === "patients") {
        await api("/patients", { clientId: value("clientId"), name: value("name"), species: value("species"), breed: value("breed"), sex: value("sex") });
      } else if (screen === "calendar") {
        await api("/appointments", { patientId: value("patientId"), start: value("start"), end: value("end"), note: value("note") });
      } else if (screen === "inventory") {
        if (value("itemId")) {
          await api(`/inventory/${value("itemId")}/movements`, { delta: Number(value("delta")), note: value("note") });
        } else {
          await api("/inventory", { name: value("name"), unit: value("unit"), threshold: Number(value("threshold") || 0) });
        }
      } else if (screen === "patient") {
        const action = value("action");
        if (action === "record") {
          await api(`/patients/${patientId}/records`, { complaint: value("complaint"), findings: value("findings"), diagnosis: value("diagnosis"), treatment: value("treatment") });
        } else if (action === "vaccine") {
          await api(`/patients/${patientId}/vaccinations`, { vaccine: value("vaccine"), givenAt: value("givenAt"), nextDueAt: value("nextDueAt"), batch: value("batch") });
        } else {
          await api(`/patients/${patientId}/studies`, { source: value("source"), title: value("title"), fileName: value("fileName"), modality: value("modality") });
        }
      } else if (screen === "billing") {
        if (value("plan")) {
          await api("/billing/subscription", { plan: value("plan"), provider: value("provider") });
        } else {
          await api("/invoices", { lines: [{ description: value("description"), qty: Number(value("qty")), unitKop: Number(value("unitKop")) }] });
        }
      } else if (screen === "notifications") {
        await api("/notifications", { channel: value("channel"), destination: value("destination"), body: value("body") });
      } else if (screen === "staff") {
        await api("/staff", { name: value("name"), email: value("email"), password: value("password"), role: value("role") });
      }
      (event.target as HTMLFormElement).reset();
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "invalid_input");
    }
  }

  return (
    <main>
      <h1>{t(locale, titleKey(screen))}</h1>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.5rem", maxWidth: 480, marginBottom: "1.5rem" }}>
        {fields(screen).map((field) => (
          <label key={field.name}>
            {t(locale, field.label)}
            <input name={field.name} type={field.type ?? "text"} required={field.required} style={inputStyle} />
          </label>
        ))}
        {screen !== "reports" && screen !== "vaccinations" ? (
          <button type="submit">{t(locale, "save")}</button>
        ) : null}
      </form>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

const inputStyle = { display: "block", width: "100%", boxSizing: "border-box" as const, marginTop: 4, padding: "0.4rem" };

function titleKey(screen: Screen): MessageKey {
  const map: Record<Screen, MessageKey> = {
    clients: "navClients",
    patients: "navPatients",
    calendar: "navCalendar",
    inventory: "navInventory",
    vaccinations: "navVaccinations",
    billing: "navBilling",
    notifications: "navNotifications",
    reports: "navReports",
    staff: "navStaff",
    patient: "navPatients",
  };
  return map[screen];
}

function fields(screen: Screen): Array<{ name: string; label: MessageKey; type?: string; required?: boolean }> {
  if (screen === "clients") {
    return [
      { name: "name", label: "yourName", required: true },
      { name: "phone", label: "phone" },
      { name: "email", label: "email" },
      { name: "note", label: "note" },
    ];
  }
  if (screen === "patients") {
    return [
      { name: "clientId", label: "navClients", required: true },
      { name: "name", label: "petName", required: true },
      { name: "species", label: "species", required: true },
      { name: "breed", label: "breed" },
      { name: "sex", label: "sex" },
    ];
  }
  if (screen === "calendar") {
    return [
      { name: "patientId", label: "navPatients", required: true },
      { name: "start", label: "start", type: "datetime-local", required: true },
      { name: "end", label: "end", type: "datetime-local", required: true },
      { name: "note", label: "note" },
    ];
  }
  if (screen === "inventory") {
    return [
      { name: "name", label: "titleField" },
      { name: "unit", label: "unit" },
      { name: "threshold", label: "threshold", type: "number" },
      { name: "itemId", label: "navInventory" },
      { name: "delta", label: "delta", type: "number" },
      { name: "note", label: "note" },
    ];
  }
  if (screen === "patient") {
    return [
      { name: "action", label: "description", required: true },
      { name: "complaint", label: "complaint" },
      { name: "findings", label: "note" },
      { name: "diagnosis", label: "description" },
      { name: "treatment", label: "note" },
      { name: "vaccine", label: "vaccine" },
      { name: "givenAt", label: "start" },
      { name: "nextDueAt", label: "end" },
      { name: "batch", label: "unit" },
      { name: "source", label: "provider" },
      { name: "title", label: "titleField" },
      { name: "fileName", label: "fileName" },
      { name: "modality", label: "species" },
    ];
  }
  if (screen === "billing") {
    return [
      { name: "plan", label: "plan" },
      { name: "provider", label: "provider" },
      { name: "description", label: "description" },
      { name: "qty", label: "qty", type: "number" },
      { name: "unitKop", label: "price", type: "number" },
    ];
  }
  if (screen === "notifications") {
    return [
      { name: "channel", label: "channel", required: true },
      { name: "destination", label: "destination", required: true },
      { name: "body", label: "messageBody", required: true },
    ];
  }
  if (screen === "staff") {
    return [
      { name: "name", label: "yourName", required: true },
      { name: "email", label: "email", required: true },
      { name: "password", label: "password", type: "password", required: true },
      { name: "role", label: "plan", required: true },
    ];
  }
  return [];
}
