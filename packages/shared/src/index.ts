/** HTTP header that carries the clinic tenant id. */
export const TENANT_HEADER = "x-tenant-id";

export type TenantId = string;

export const LOCALES = ["uk", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
