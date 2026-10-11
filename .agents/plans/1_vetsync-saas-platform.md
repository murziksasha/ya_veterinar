# Grill: VetSync SaaS platform for veterinary clinics
Date: 2026-10-11

## Intent
Build a full SaaS product (VetSync) for veterinary clinics on the Ukrainian market — a competitor to ENOTE, RO App, and Appointer. One developer + AI. All 13 feature modules planned across 3 phases. Complete stack migration from Express/Mongoose/React to NestJS + PostgreSQL (Prisma) + Next.js App Router.

## Constraints
- Solo developer + AI — each module adds 1–2 months.
- 18–24 months total for all 13 modules across 3 phases.
- MVP (Phase 1) within 3–4 months to start collecting feedback.
- Budget-conscious: Docker Compose + VPS (Hetzner), no K8s.
- Code and comments in English. UI strings in Ukrainian + English (i18n).
- File encoding: UTF-8 only.
- Cloud SaaS + self-hosted (Docker) delivery model.
- No marketing landing page in scope.

## Key decisions
- Decision: NestJS + PostgreSQL (Prisma) + Next.js App Router. Reason: ACID transactions for financial module, strict schemas, modular DI, SSR for public booking page. Alternative considered: keep Express/Mongoose/React.
- Decision: Monorepo with Turborepo (`apps/api`, `apps/web`, `packages/shared`). Reason: single dev, shared types, atomic commits. Alternative considered: separate repos.
- Decision: Row-level tenancy with `tenantId` + PostgreSQL RLS. Reason: simplest for start, scales to hundreds of clinics. Alternative considered: schema-per-tenant, DB-per-tenant.
- Decision: PWA for mobile. Reason: one codebase, no app store overhead. Alternative considered: React Native, Capacitor.
- Decision: Fixed price per clinic (unlimited users). Reason: simpler billing, attractive to clinics. Alternative considered: per-seat pricing, freemium.
- Decision: Billing via Stripe + LiqPay + Monobank Acquiring. Reason: Stripe for international + recurring, LiqPay/Monobank for Ukrainian market. Alternative considered: WayForPay.
- Decision: PRRO integration via adapter pattern (Checkbox, pRRO.ua, etc.). Reason: pluggable, new providers added without core changes. Alternative considered: hardcoded Checkbox only.
- Decision: Notification channels: Telegram Bot + SMS (TurboSMS) + Email + Push (PWA). Reason: Telegram dominant in Ukraine, SMS as fallback, push is free. Alternative considered: SMS only.
- Decision: Diagnostic equipment integration via adapter pattern + manual DICOM/image upload. Reason: no single standard in Ukraine. Alternative considered: HL7 FHIR, delay entirely.
- Decision: Full BI module with interactive dashboards. Reason: competitive advantage. Alternative considered: basic counters only.
- Decision: Plugin/adapter architecture for all integrations. Reason: extensibility without core changes. NestJS DI ideal for this.
- Decision: Product name VetSync. Reason: short, professional, memorable.
- Decision: Landing page removed from scope. Reason: separate concern, don't block product development.

## Surfaced assumptions
- No existing backend/frontend code to migrate. Starting from scratch.
- AGENTS.md and DOCUMENTATION/*.md will be rewritten for the new stack.
- The grill session about `pendingApproval` status was for an older project version and is not carried over.
- Multi-tenant means clinics as tenants, not individual users.
- Self-hosted = Docker Compose package that clinics can deploy on their own servers.

## Open questions
- Specific pricing tiers (e.g., Basic 500 UAH/mo, Pro 1000 UAH/mo) — to be decided later.
- Domain name (vetclinic.ua availability) — to be checked.
- Specific diagnostic equipment brands to target first adapters for.
- Trial period length (14 days vs 30 days).

## Out of scope
- Marketing/landing page website.
- Native mobile apps (iOS/Android via React Native).
- Kubernetes orchestration.
- Full HL7 FHIR compliance.
- Data migration from competitor systems (ENOTE, RO App).

