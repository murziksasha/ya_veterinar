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
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-brand-group">
          <a className="workspace-brand" href={`/${locale}/app`}>
            {t(locale, "product")}
          </a>
          <span className="workspace-badge">{user.role}</span>
        </div>
        <div className="workspace-header-actions">
          <span className="workspace-user-chip">
            {t(locale, "signedInAs")} <strong>{user.name}</strong>
          </span>
          <SignOut locale={locale} />
        </div>
      </header>
      <nav className="workspace-nav">
        {links.map(([path, key]) => (
          <a key={path} href={`/${locale}/app/${path}`}>
            {t(locale, key)}
          </a>
        ))}
      </nav>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
