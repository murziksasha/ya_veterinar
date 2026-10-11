/** HTTP header that carries the clinic tenant id. */
export const TENANT_HEADER = "x-tenant-id";

export type TenantId = string;

export const LOCALES = ["uk", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const STAFF_ROLES = ["owner", "veterinarian", "assistant"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/** Signed-in staff member. No password material. */
export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: StaffRole;
};

export const SESSION_COOKIE = "vetsync_session";

/** Prices in kopiykas. Trial is free for 14 days. */
export const PLAN_PRICE_KOP = { trial: 0, basic: 50000, pro: 100000 } as const;

export const CLINIC_PLANS = ["trial", "basic", "pro"] as const;
export type ClinicPlan = (typeof CLINIC_PLANS)[number];

export const PAYMENT_PROVIDERS = ["stripe", "liqpay", "monobank"] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDERS)[number];

export const FISCAL_PROVIDERS = ["checkbox", "prro_ua"] as const;
export type FiscalProviderId = (typeof FISCAL_PROVIDERS)[number];

export const NOTIFY_CHANNELS = ["telegram", "sms", "email", "push"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

export const DIAGNOSTIC_SOURCES = ["manual", "generic_analyzer"] as const;
export type DiagnosticSource = (typeof DIAGNOSTIC_SOURCES)[number];

export function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}
