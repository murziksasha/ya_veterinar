import type { Locale } from "@vetsync/shared";

const messages = {
  uk: {
    product: "VetSync",
    title: "Робочий простір клініки",
    body: "Обліковий запис, картки пацієнтів і розклад з’являться в першій фазі.",
    tenantHeader: "Заголовок тенанта",
  },
  en: {
    product: "VetSync",
    title: "Clinic workspace",
    body: "Accounts, patient records, and the schedule arrive in phase 1.",
    tenantHeader: "Tenant header",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
