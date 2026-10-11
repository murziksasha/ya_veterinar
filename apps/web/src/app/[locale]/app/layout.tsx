import { isLocale } from "@vetsync/shared";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { t } from "@/i18n/messages";
import { currentUser } from "@/lib/api";
import { SignOut } from "./sign-out";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const user = await currentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const links = [
    ["clients", "navClients"],
    ["patients", "navPatients"],
    ["calendar", "navCalendar"],
    ["inventory", "navInventory"],
    ["vaccinations", "navVaccinations"],
    ["billing", "navBilling"],
    ["notifications", "navNotifications"],
    ["reports", "navReports"],
    ["staff", "navStaff"],
  ] as const;

  return (
    <div>
      <header
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          background: "#0f766e",
          color: "white",
        }}
      >
        <a href={`/${locale}/app`} style={{ color: "white", fontWeight: 700 }}>
          {t(locale, "product")}
        </a>
        <nav style={{ display: "flex", gap: "0.75rem", flex: 1 }}>
          {links.map(([path, key]) => (
            <a key={path} href={`/${locale}/app/${path}`} style={{ color: "white" }}>
              {t(locale, key)}
            </a>
          ))}
        </nav>
        <span>
          {t(locale, "signedInAs")} {user.name}
        </span>
        <SignOut locale={locale} />
      </header>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}
