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
