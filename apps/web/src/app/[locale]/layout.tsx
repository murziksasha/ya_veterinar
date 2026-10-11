import { isLocale, type Locale } from "@vetsync/shared";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export default async function LocaleLayout({
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

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          fontFamily: "Segoe UI, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        {children}
      </body>
    </html>
  );
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return [{ locale: "uk" }, { locale: "en" }];
}
