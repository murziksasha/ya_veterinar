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

  async function moveVisit(id: string, status: string) {
    setError(undefined);
    try {
      await api(`/appointments/${id}`, { status }, "PATCH");
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "invalid_input");
    }
  }

  const formFields = fields(screen);
  const showForm = screen !== "reports" && screen !== "vaccinations" && formFields.length > 0;

  return (
    <main className="printable screen-container">
      <header className="screen-header">
        <h1 className="screen-title">{t(locale, titleKey(screen))}</h1>
        <div className="screen-actions no-print">
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => window.print()}>
            {t(locale, "print")}
          </button>
        </div>
      </header>

      {error ? (
        <div style={{ padding: "0.75rem 1rem", background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)" }}>
          {error}
        </div>
      ) : null}

      <div className={showForm ? "screen-split" : ""}>
        {showForm ? (
          <aside className="screen-form-panel no-print">
            <h2 className="screen-form-title">{t(locale, "quickAdd")}</h2>
            <form onSubmit={onSubmit} className="form-grid">
              {formFields.map((field) => (
                <label key={field.name} className="form-label">
                  <span>{t(locale, field.label)}</span>
                  <input
                    name={field.name}
                    type={field.type ?? "text"}
                    required={field.required}
                    className="form-input"
                  />
                </label>
              ))}
              <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                {t(locale, "save")}
              </button>
            </form>
          </aside>
        ) : null}

        <section className="screen-data-panel">
          <DataView locale={locale} screen={screen} data={data} onMove={moveVisit} />
        </section>
      </div>
    </main>
  );
}

const STATUSES = ["scheduled", "done", "cancelled"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  if (!isRecord(data)) {
    return [];
  }
  const nested = Object.values(data).find((value) => Array.isArray(value));
  return Array.isArray(nested) ? nested.filter(isRecord) : [];
}

function DataView({
  locale,
  screen,
  data,
  onMove,
}: {
  locale: Locale;
  screen: Screen;
  data: unknown;
  onMove: (id: string, status: string) => void;
}) {
  // BI Reports view
  if (screen === "reports" && isRecord(data)) {
    return (
      <div className="metrics-grid">
        {Object.entries(data).map(([key, value]) => (
          <div className="metric-card" key={key}>
            <div className="metric-label">{key}</div>
            <div className="metric-value">{String(value)}</div>
          </div>
        ))}
      </div>
    );
  }

  // Multi-panel Patient Profile View
  if (screen === "patient" && isRecord(data)) {
    const records = Array.isArray(data.records) ? data.records.filter(isRecord) : [];
    const vaccines = Array.isArray(data.vaccines) ? data.vaccines.filter(isRecord) : [];
    const studies = Array.isArray(data.studies) ? data.studies.filter(isRecord) : [];
    const visits = Array.isArray(data.visits) ? data.visits.filter(isRecord) : [];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <article className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ fontSize: "1.25rem" }}>{String(data.name ?? "")}</h2>
            <span className="badge badge-neutral">{String(data.species ?? "")}</span>
          </div>
          <div className="card-kv">
            <span className="card-key">{t(locale, "breed")}:</span>
            <span className="card-val">{String(data.breed ?? "—")}</span>
            <span className="card-key">{t(locale, "sex")}:</span>
            <span className="card-val">{String(data.sex ?? "—")}</span>
          </div>
        </article>

        <div className="patient-panels">
          {/* Medical Records Panel */}
          <section className="panel-section">
            <h3 className="panel-title">{t(locale, "medicalRecords")} ({records.length})</h3>
            {records.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t(locale, "emptyState")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {records.map((rec) => (
                  <article key={String(rec.id)} className="card">
                    <div style={{ fontWeight: 600, color: "var(--primary-dark)" }}>{String(rec.complaint ?? "")}</div>
                    {rec.diagnosis ? (
                      <div style={{ fontSize: "0.875rem" }}>
                        <strong>{t(locale, "description")}:</strong> {String(rec.diagnosis)}
                      </div>
                    ) : null}
                    {rec.treatment ? (
                      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        <strong>{t(locale, "note")}:</strong> {String(rec.treatment)}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Vaccinations Panel */}
          <section className="panel-section">
            <h3 className="panel-title">{t(locale, "navVaccinations")} ({vaccines.length})</h3>
            {vaccines.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t(locale, "emptyState")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {vaccines.map((v) => (
                  <article key={String(v.id)} className="card">
                    <div className="card-header">
                      <strong>{String(v.vaccine ?? "")}</strong>
                      {v.nextDueAt ? (
                        <span className="badge badge-warning">{String(v.nextDueAt).slice(0, 10)}</span>
                      ) : null}
                    </div>
                    <div className="card-kv">
                      <span className="card-key">{t(locale, "start")}:</span>
                      <span className="card-val">{String(v.givenAt ?? "").slice(0, 10)}</span>
                      {v.batch ? (
                        <>
                          <span className="card-key">{t(locale, "unit")}:</span>
                          <span className="card-val">{String(v.batch)}</span>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Diagnostics Panel */}
          <section className="panel-section">
            <h3 className="panel-title">{t(locale, "studies")} ({studies.length})</h3>
            {studies.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t(locale, "emptyState")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {studies.map((s) => (
                  <article key={String(s.id)} className="card">
                    <div className="card-header">
                      <strong>{String(s.title ?? "")}</strong>
                      <span className="badge badge-neutral">{String(s.modality ?? s.source ?? "")}</span>
                    </div>
                    {s.fileName ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--accent)" }}>{String(s.fileName)}</div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Visits Timeline */}
          {visits.length > 0 ? (
            <section className="panel-section">
              <h3 className="panel-title">{t(locale, "visits")} ({visits.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {visits.map((vis) => (
                  <article key={String(vis.id)} className="card">
                    <div className="card-header">
                      <span>{String(vis.start ?? "")}</span>
                      <span className={`badge badge-${vis.status === "done" ? "done" : vis.status === "cancelled" ? "cancelled" : "scheduled"}`}>
                        {t(locale, (vis.status as MessageKey) || "scheduled")}
                      </span>
                    </div>
                    {vis.note ? <div style={{ fontSize: "0.875rem" }}>{String(vis.note)}</div> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  // Calendar / Kanban board view
  if (screen === "calendar") {
    const rows = asRows(data);
    return (
      <div className="board">
        {STATUSES.map((status) => {
          const statusRows = rows.filter((row) => row.status === status);
          return (
            <section className="board-col" key={status}>
              <div className="board-col-header">
                <h2 className="board-col-title">{t(locale, status)}</h2>
                <span className="badge badge-neutral">{statusRows.length}</span>
              </div>
              {statusRows.map((row) => (
                <article className="board-card" key={String(row.id)}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--primary-dark)" }}>
                    {String(row.start ?? "").replace("T", " ").slice(0, 16)}
                  </div>
                  {row.note ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{String(row.note)}</div>
                  ) : null}
                  <div className="no-print" style={{ marginTop: "0.35rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span>{t(locale, "move")}:</span>
                      <select
                        className="form-select"
                        style={{ padding: "0.2rem 0.4rem", fontSize: "0.8rem", width: "auto" }}
                        value={status}
                        onChange={(event) => onMove(String(row.id), event.target.value)}
                      >
                        {STATUSES.map((next) => (
                          <option key={next} value={next}>
                            {t(locale, next)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    );
  }

  // Entity Lists (Clients, Patients, Inventory, Vaccinations, Staff, Notifications, Billing)
  const rows = asRows(data);
  if (rows.length > 0) {
    return (
      <div className="cards-grid">
        {rows.map((row) => {
          const rowId = String(row.id ?? Math.random());

          if (screen === "clients") {
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <h3 className="card-title">{String(row.name ?? "")}</h3>
                </div>
                <div className="card-kv">
                  {row.phone ? (
                    <>
                      <span className="card-key">{t(locale, "phone")}:</span>
                      <span className="card-val">{String(row.phone)}</span>
                    </>
                  ) : null}
                  {row.email ? (
                    <>
                      <span className="card-key">{t(locale, "email")}:</span>
                      <span className="card-val">{String(row.email)}</span>
                    </>
                  ) : null}
                  {row.note ? (
                    <>
                      <span className="card-key">{t(locale, "note")}:</span>
                      <span className="card-val">{String(row.note)}</span>
                    </>
                  ) : null}
                </div>
              </article>
            );
          }

          if (screen === "patients") {
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <h3 className="card-title">{String(row.name ?? "")}</h3>
                  <span className="badge badge-neutral">{String(row.species ?? "")}</span>
                </div>
                <div className="card-kv">
                  {row.breed ? (
                    <>
                      <span className="card-key">{t(locale, "breed")}:</span>
                      <span className="card-val">{String(row.breed)}</span>
                    </>
                  ) : null}
                  {row.sex ? (
                    <>
                      <span className="card-key">{t(locale, "sex")}:</span>
                      <span className="card-val">{String(row.sex)}</span>
                    </>
                  ) : null}
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <a href={`/${locale}/app/patients/${row.id}`} className="btn btn-secondary btn-sm">
                    {t(locale, "details")} →
                  </a>
                </div>
              </article>
            );
          }

          if (screen === "inventory") {
            const isLowStock = row.threshold && Number(row.quantity) <= Number(row.threshold);
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <h3 className="card-title">{String(row.name ?? "")}</h3>
                  {isLowStock ? (
                    <span className="badge badge-warning">{t(locale, "lowStock")}</span>
                  ) : null}
                </div>
                <div className="card-kv">
                  <span className="card-key">{t(locale, "qty")}:</span>
                  <span className="card-val" style={{ fontWeight: 700 }}>
                    {String(row.quantity)} {String(row.unit ?? "")}
                  </span>
                  {row.threshold ? (
                    <>
                      <span className="card-key">{t(locale, "threshold")}:</span>
                      <span className="card-val">{String(row.threshold)}</span>
                    </>
                  ) : null}
                </div>
              </article>
            );
          }

          if (screen === "vaccinations") {
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <h3 className="card-title">{String(row.vaccine ?? "")}</h3>
                  {row.nextDueAt ? (
                    <span className="badge badge-warning">{String(row.nextDueAt).slice(0, 10)}</span>
                  ) : null}
                </div>
                <div className="card-kv">
                  <span className="card-key">{t(locale, "start")}:</span>
                  <span className="card-val">{String(row.givenAt ?? "").slice(0, 10)}</span>
                  {row.batch ? (
                    <>
                      <span className="card-key">{t(locale, "unit")}:</span>
                      <span className="card-val">{String(row.batch)}</span>
                    </>
                  ) : null}
                </div>
              </article>
            );
          }

          if (screen === "staff") {
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <h3 className="card-title">{String(row.name ?? "")}</h3>
                  <span className="badge badge-neutral">{String(row.role ?? "")}</span>
                </div>
                <div className="card-kv">
                  <span className="card-key">{t(locale, "email")}:</span>
                  <span className="card-val">{String(row.email ?? "")}</span>
                </div>
              </article>
            );
          }

          if (screen === "notifications") {
            return (
              <article className="card" key={rowId}>
                <div className="card-header">
                  <span className="badge badge-neutral">{String(row.channel ?? "")}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{String(row.destination ?? "")}</span>
                </div>
                <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{String(row.body ?? "")}</div>
              </article>
            );
          }

          // Generic card fallback
          return (
            <article className="card" key={rowId}>
              <div className="card-header">
                <h3 className="card-title">{String(row.name ?? row.title ?? row.id ?? "")}</h3>
              </div>
              <div className="card-kv">
                {Object.entries(row)
                  .filter(([k]) => k !== "id" && k !== "tenantId" && k !== "createdAt" && k !== "updatedAt")
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <span key={k} style={{ display: "contents" }}>
                      <span className="card-key">{k}:</span>
                      <span className="card-val">{String(v)}</span>
                    </span>
                  ))}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
      {t(locale, "emptyState")}
    </div>
  );
}

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
