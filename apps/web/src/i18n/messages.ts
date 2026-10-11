import type { Locale } from "@vetsync/shared";

const messages = {
  uk: {
    product: "VetSync",
    title: "Робочий простір клініки",
    body: "Обліковий запис клініки, картки пацієнтів і розклад.",
    tenantHeader: "Заголовок тенанта",
    signIn: "Увійти",
    register: "Зареєструвати клініку",
    signOut: "Вийти",
    clinicName: "Назва клініки",
    yourName: "Ваше ім’я",
    email: "Електронна пошта",
    password: "Пароль",
    submit: "Продовжити",
    haveAccount: "Вже є обліковий запис",
    needAccount: "Нова клініка",
    workspace: "Робочий простір",
    navClients: "Клієнти",
    navPatients: "Пацієнти",
    navCalendar: "Розклад",
    navInventory: "Склад",
    navVaccinations: "Вакцинації",
    comingNext: "Цей розділ з’явиться в наступному кроці фази 1.",
    invalidInput: "Перевірте поля. Пароль — щонайменше 8 символів.",
    emailTaken: "Ця пошта вже зареєстрована.",
    invalidCredentials: "Невірна пошта або пароль.",
    signedInAs: "Ви увійшли як",
  },
  en: {
    product: "VetSync",
    title: "Clinic workspace",
    body: "Clinic account, patient records, and the schedule.",
    tenantHeader: "Tenant header",
    signIn: "Sign in",
    register: "Register a clinic",
    signOut: "Sign out",
    clinicName: "Clinic name",
    yourName: "Your name",
    email: "Email",
    password: "Password",
    submit: "Continue",
    haveAccount: "Already have an account",
    needAccount: "New clinic",
    workspace: "Workspace",
    navClients: "Clients",
    navPatients: "Patients",
    navCalendar: "Calendar",
    navInventory: "Inventory",
    navVaccinations: "Vaccinations",
    comingNext: "This section arrives in a later step of phase 1.",
    invalidInput: "Check the fields. Password must be at least 8 characters.",
    emailTaken: "This email is already registered.",
    invalidCredentials: "Unknown email or password.",
    signedInAs: "Signed in as",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
