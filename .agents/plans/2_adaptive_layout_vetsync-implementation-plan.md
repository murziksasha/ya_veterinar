VetSync — Implementation Plan
Goal Description

Build VetSync — a full-featured cloud SaaS platform for veterinary clinics targeting the Ukrainian market. The product competes with ENOTE, RO App, Appointer, and Clinica Web. It covers medical records, vaccination tracking, appointment scheduling, CRM, inventory, finance (PRRO), kanban workflows, notifications, diagnostics integration, BI analytics, multi-tenancy, RBAC, and print forms.

Stack: NestJS + PostgreSQL (Prisma) + Next.js App Router
Architecture: Monorepo (Turborepo), row-level multi-tenancy, plugin/adapter pattern for integrations
Delivery: Cloud SaaS + self-hosted (Docker Compose)
Mobile: PWA
i18n: Ukrainian + English

User Review Required

IMPORTANT

This plan covers 13 modules across 3 phases (18–24 months). Phase 1 (MVP) targets 3–4 months to first deployable product. Review the phase breakdown and module assignment carefully — reordering modules between phases is the highest-impact decision.

WARNING

Stack migration: This plan abandons the existing Express 5 + Mongoose 9 + React (FSD) stack from AGENTS.md. AGENTS.md and all DOCUMENTATION files will be rewritten. The .grill/pending-approval-status.md session is obsolete.

CAUTION

Solo developer risk: 13 modules for 1 person is aggressive. If any phase takes 50% longer than planned, total delivery extends to 27–36 months. Consider hiring a second developer after MVP launch generates revenue.

Phase Breakdown
Proposed Changes

1. Project Setup & Infrastructure
   [NEW] Monorepo structure
   vetsync/
   ├── apps/
   │ ├── api/ # NestJS backend
   │ │ ├── src/
   │ │ │ ├── modules/ # Domain modules (NestJS modules)
   │ │ │ │ ├── auth/
   │ │ │ │ ├── tenant/
   │ │ │ │ ├── user/
   │ │ │ │ ├── client/
   │ │ │ │ ├── pet/
   │ │ │ │ ├── medical-record/
   │ │ │ │ ├── vaccination/
   │ │ │ │ ├── appointment/
   │ │ │ │ ├── inventory/
   │ │ │ │ ├── finance/
   │ │ │ │ ├── prro/
   │ │ │ │ ├── order/
   │ │ │ │ ├── notification/
   │ │ │ │ ├── diagnostic/
   │ │ │ │ ├── report/
   │ │ │ │ └── billing/
   │ │ │ ├── common/ # Guards, interceptors, filters, pipes
   │ │ │ │ ├── guards/
   │ │ │ │ │ ├── jwt-auth.guard.ts
   │ │ │ │ │ ├── roles.guard.ts
   │ │ │ │ │ └── tenant.guard.ts
   │ │ │ │ ├── interceptors/
   │ │ │ │ │ ├── tenant.interceptor.ts
   │ │ │ │ │ └── logging.interceptor.ts
   │ │ │ │ ├── filters/
   │ │ │ │ │ └── http-exception.filter.ts
   │ │ │ │ ├── pipes/
   │ │ │ │ │ └── zod-validation.pipe.ts
   │ │ │ │ └── decorators/
   │ │ │ │ ├── current-user.decorator.ts
   │ │ │ │ ├── current-tenant.decorator.ts
   │ │ │ │ └── roles.decorator.ts
   │ │ │ ├── integrations/ # External service adapters
   │ │ │ │ ├── prro/
   │ │ │ │ │ ├── prro.interface.ts
   │ │ │ │ │ ├── checkbox.adapter.ts
   │ │ │ │ │ └── prro-ua.adapter.ts
   │ │ │ │ ├── payment/
   │ │ │ │ │ ├── payment.interface.ts
   │ │ │ │ │ ├── stripe.adapter.ts
   │ │ │ │ │ ├── liqpay.adapter.ts
   │ │ │ │ │ └── monobank.adapter.ts
   │ │ │ │ ├── notification/
   │ │ │ │ │ ├── notification.interface.ts
   │ │ │ │ │ ├── telegram.adapter.ts
   │ │ │ │ │ ├── sms.adapter.ts
   │ │ │ │ │ ├── email.adapter.ts
   │ │ │ │ │ └── push.adapter.ts
   │ │ │ │ └── diagnostic/
   │ │ │ │ ├── diagnostic.interface.ts
   │ │ │ │ └── manual-upload.adapter.ts
   │ │ │ ├── database/
   │ │ │ │ ├── prisma.service.ts
   │ │ │ │ ├── prisma.module.ts
   │ │ │ │ └── seeds/
   │ │ │ ├── config/
   │ │ │ │ └── configuration.ts
   │ │ │ ├── app.module.ts
   │ │ │ └── main.ts
   │ │ ├── prisma/
   │ │ │ ├── schema.prisma
   │ │ │ └── migrations/
   │ │ ├── test/
   │ │ ├── nest-cli.json
   │ │ ├── tsconfig.json
   │ │ └── package.json
   │ │
   │ └── web/ # Next.js frontend
   │ ├── src/
   │ │ ├── app/ # App Router
   │ │ │ ├── [locale]/
   │ │ │ │ ├── (auth)/
   │ │ │ │ │ ├── login/
   │ │ │ │ │ └── register/
   │ │ │ │ ├── (dashboard)/
   │ │ │ │ │ ├── layout.tsx
   │ │ │ │ │ ├── page.tsx # Dashboard home
   │ │ │ │ │ ├── clients/
   │ │ │ │ │ ├── pets/
   │ │ │ │ │ ├── medical/
   │ │ │ │ │ ├── appointments/
   │ │ │ │ │ ├── inventory/
   │ │ │ │ │ ├── finance/
   │ │ │ │ │ ├── orders/
   │ │ │ │ │ ├── reports/
   │ │ │ │ │ └── settings/
   │ │ │ │ └── (public)/
   │ │ │ │ └── book/ # Public booking page
   │ │ │ ├── api/ # Next.js API routes (BFF proxy)
   │ │ │ └── layout.tsx
   │ │ ├── components/ # Shared UI components
   │ │ │ ├── ui/ # Primitives (shadcn/ui)
   │ │ │ ├── forms/
   │ │ │ ├── tables/
   │ │ │ ├── charts/
   │ │ │ └── layout/
   │ │ ├── lib/ # Utilities, API client, hooks
   │ │ │ ├── api-client.ts
   │ │ │ ├── auth.ts
   │ │ │ └── utils.ts
   │ │ ├── hooks/
   │ │ ├── stores/ # Zustand stores
   │ │ ├── types/
   │ │ └── i18n/
   │ │ ├── messages/
   │ │ │ ├── uk.json
   │ │ │ └── en.json
   │ │ └── config.ts
   │ ├── public/
   │ │ ├── manifest.json # PWA manifest
   │ │ └── sw.js # Service worker
   │ ├── next.config.ts
   │ ├── tailwind.config.ts
   │ ├── tsconfig.json
   │ └── package.json
   │
   ├── packages/
   │ └── shared/ # Shared types, validators, constants
   │ ├── src/
   │ │ ├── types/
   │ │ │ ├── auth.ts
   │ │ │ ├── client.ts
   │ │ │ ├── pet.ts
   │ │ │ ├── medical-record.ts
   │ │ │ ├── appointment.ts
   │ │ │ ├── inventory.ts
   │ │ │ ├── finance.ts
   │ │ │ └── order.ts
   │ │ ├── validators/ # Zod schemas (shared between API & web)
   │ │ ├── constants/
   │ │ │ ├── roles.ts
   │ │ │ ├── pet-species.ts
   │ │ │ ├── order-statuses.ts
   │ │ │ └── currencies.ts
   │ │ └── index.ts
   │ ├── tsconfig.json
   │ └── package.json
   │
   ├── docker/
   │ ├── Dockerfile.api
   │ ├── Dockerfile.web
   │ ├── docker-compose.yml # Development
   │ ├── docker-compose.prod.yml # Production SaaS
   │ └── docker-compose.selfhosted.yml # Self-hosted package
   │
   ├── turbo.json
   ├── package.json
   ├── tsconfig.base.json
   ├── .env.example
   ├── .gitignore
   ├── AGENTS.md # Updated for new stack
   └── DOCUMENTATION/
   ├── README.md
   ├── ARCHITECTURE.md
   ├── DEVELOPMENT.md
   ├── API.md
   ├── SECURITY.md
   ├── TESTING.md
   ├── UI_DESIGN_SYSTEM.md
   └── ... (domain-specific docs)
   [NEW] Prisma schema (core entities)
   prisma
   // prisma/schema.prisma
   generator client {
   provider = "prisma-client-js"
   }
   datasource db {
   provider = "postgresql"
   url = env("DATABASE_URL")
   }
   // ── Multi-tenancy ──────────────────────────────────────
   model Tenant {
   id String @id @default(cuid())
   name String
   slug String @unique // URL-friendly: app.vetsync.ua/{slug}
   plan Plan @default(TRIAL)
   trialEndsAt DateTime?
   isActive Boolean @default(true)
   settings Json @default("{}")
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   users User[]
   clients Client[]
   pets Pet[]
   appointments Appointment[]
   orders Order[]
   inventory InventoryItem[]
   // ... other relations
   @@map("tenants")
   }
   enum Plan {
   TRIAL
   BASIC
   PRO
   ENTERPRISE
   }
   // ── Auth & RBAC ────────────────────────────────────────
   model User {
   id String @id @default(cuid())
   tenantId String
   tenant Tenant @relation(fields: [tenantId], references: [id])
   email String
   password String
   firstName String
   lastName String
   role Role @default(VETERINARIAN)
   isActive Boolean @default(true)
   avatar String?
   phone String?
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   appointments Appointment[]
   medicalRecords MedicalRecord[]
   orders Order[]
   @@unique([tenantId, email])
   @@map("users")
   }
   enum Role {
   OWNER
   ADMIN
   VETERINARIAN
   ASSISTANT
   RECEPTIONIST
   }
   // ── Clients (Pet Owners) ───────────────────────────────
   model Client {
   id String @id @default(cuid())
   tenantId String
   tenant Tenant @relation(fields: [tenantId], references: [id])
   firstName String
   lastName String
   phone String
   email String?
   address String?
   notes String?
   telegramChatId String? // For Telegram notifications
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   pets Pet[]
   appointments Appointment[]
   orders Order[]
   @@index([tenantId])
   @@map("clients")
   }
   // ── Pets ───────────────────────────────────────────────
   model Pet {
   id String @id @default(cuid())
   tenantId String
   tenant Tenant @relation(fields: [tenantId], references: [id])
   clientId String
   client Client @relation(fields: [clientId], references: [id])
   name String
   species Species
   breed String?
   gender Gender?
   dateOfBirth DateTime?
   weight Decimal? @db.Decimal(8, 2)
   color String?
   microchipId String?
   isNeutered Boolean @default(false)
   isDeceased Boolean @default(false)
   avatar String?
   notes String?
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   medicalRecords MedicalRecord[]
   vaccinations Vaccination[]
   appointments Appointment[]
   orders Order[]
   @@index([tenantId])
   @@index([clientId])
   @@map("pets")
   }
   enum Species {
   DOG
   CAT
   BIRD
   REPTILE
   RODENT
   RABBIT
   FISH
   HORSE
   EXOTIC
   OTHER
   }
   enum Gender {
   MALE
   FEMALE
   UNKNOWN
   }
   // ── Medical Records ────────────────────────────────────
   model MedicalRecord {
   id String @id @default(cuid())
   tenantId String
   petId String
   pet Pet @relation(fields: [petId], references: [id])
   veterinarianId String
   veterinarian User @relation(fields: [veterinarianId], references: [id])
   visitDate DateTime @default(now())
   complaint String? // Chief complaint
   anamnesis String? // History
   examination String? // Physical exam findings
   diagnosis String?
   treatment String? // Treatment plan
   prescription String? // Medications prescribed
   notes String?
   weight Decimal? @db.Decimal(8, 2)
   temperature Decimal? @db.Decimal(4, 1)
   attachments Json @default("[]") // File references
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   @@index([tenantId])
   @@index([petId])
   @@map("medical_records")
   }
   // ── Vaccinations ───────────────────────────────────────
   model Vaccination {
   id String @id @default(cuid())
   tenantId String
   petId String
   pet Pet @relation(fields: [petId], references: [id])
   vaccineName String
   vaccineManufacturer String?
   batchNumber String?
   dateAdministered DateTime
   nextDueDate DateTime?
   veterinarianId String?
   notes String?
   createdAt DateTime @default(now())
   @@index([tenantId])
   @@index([petId])
   @@index([nextDueDate])
   @@map("vaccinations")
   }
   // ── Appointments ───────────────────────────────────────
   model Appointment {
   id String @id @default(cuid())
   tenantId String
   tenant Tenant @relation(fields: [tenantId], references: [id])
   clientId String
   client Client @relation(fields: [clientId], references: [id])
   petId String?
   pet Pet? @relation(fields: [petId], references: [id])
   veterinarianId String
   veterinarian User @relation(fields: [veterinarianId], references: [id])
   startTime DateTime
   endTime DateTime
   status AppointmentStatus @default(SCHEDULED)
   type String? // consultation, surgery, vaccination, etc.
   notes String?
   source BookingSource @default(INTERNAL)
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   @@index([tenantId])
   @@index([veterinarianId, startTime])
   @@index([startTime])
   @@map("appointments")
   }
   enum AppointmentStatus {
   SCHEDULED
   CONFIRMED
   IN_PROGRESS
   COMPLETED
   CANCELLED
   NO_SHOW
   }
   enum BookingSource {
   INTERNAL // Booked by staff
   ONLINE // Booked by client via public page
   TELEGRAM // Booked via Telegram bot
   }
   // ── Inventory ──────────────────────────────────────────
   model InventoryItem {
   id String @id @default(cuid())
   tenantId String
   tenant Tenant @relation(fields: [tenantId], references: [id])
   name String
   sku String?
   category String?
   unit String // ml, tablet, capsule, piece, gram, etc.
   quantity Decimal @db.Decimal(12, 4) // Fractional units
   minQuantity Decimal? @db.Decimal(12, 4) // Low stock threshold
   costPrice Decimal? @db.Decimal(12, 2)
   sellPrice Decimal? @db.Decimal(12, 2)
   expiryDate DateTime?
   supplier String?
   isActive Boolean @default(true)
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   movements InventoryMovement[]
   @@unique([tenantId, sku])
   @@index([tenantId])
   @@map("inventory_items")
   }
   model InventoryMovement {
   id String @id @default(cuid())
   tenantId String
   itemId String
   item InventoryItem @relation(fields: [itemId], references: [id])
   type MovementType
   quantity Decimal @db.Decimal(12, 4) // Can be fractional (0.5ml)
   reason String?
   orderId String? // Link to order if consumption
   performedBy String?
   createdAt DateTime @default(now())
   @@index([tenantId])
   @@index([itemId])
   @@map("inventory_movements")
   }
   enum MovementType {
   RECEIPT // Stock in
   CONSUMPTION // Used during procedure
   ADJUSTMENT // Manual correction
   WRITEOFF // Expired / damaged
   RETURN // Return to supplier
   }
   // ── Orders (Kanban) ────────────────────────────────────
   model Order {
   id String @id @default(cuid())
   tenantId String
   orderNumber String // Auto-generated: V000001
   clientId String
   client Client @relation(fields: [clientId], references: [id])
   petId String?
   pet Pet? @relation(fields: [petId], references: [id])
   assignedTo String?
   assignee User? @relation(fields: [assignedTo], references: [id])
   status OrderStatus @default(NEW)
   type OrderType @default(CONSULTATION)
   totalAmount Decimal? @db.Decimal(12, 2)
   paidAmount Decimal? @db.Decimal(12, 2)
   notes String?
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   items OrderItem[]
   payments Payment[]
   @@index([tenantId])
   @@index([status])
   @@map("orders")
   }
   enum OrderStatus {
   NEW
   DIAGNOSTICS
   PENDING_APPROVAL
   CLIENT_APPROVED
   WAITING_PARTS
   IN_PROGRESS
   COMPLETED
   PAID
   CANCELLED
   }
   enum OrderType {
   CONSULTATION
   SURGERY
   VACCINATION
   GROOMING
   DIAGNOSTICS
   HOSPITALIZATION
   OTHER
   }
   model OrderItem {
   id String @id @default(cuid())
   orderId String
   order Order @relation(fields: [orderId], references: [id])
   description String
   quantity Decimal @db.Decimal(12, 4)
   unitPrice Decimal @db.Decimal(12, 2)
   totalPrice Decimal @db.Decimal(12, 2)
   inventoryItemId String? // Auto-deduct from inventory
   @@map("order_items")
   }
   // ── Finance ────────────────────────────────────────────
   model Payment {
   id String @id @default(cuid())
   tenantId String
   orderId String?
   order Order? @relation(fields: [orderId], references: [id])
   amount Decimal @db.Decimal(12, 2)
   method PaymentMethod
   status PaymentStatus @default(COMPLETED)
   prroReceiptId String? // PRRO fiscal receipt number
   externalId String? // External payment system ID
   createdAt DateTime @default(now())
   @@index([tenantId])
   @@map("payments")
   }
   enum PaymentMethod {
   CASH
   CARD
   TRANSFER
   MONOBANK_QR
   LIQPAY
   }
   enum PaymentStatus {
   PENDING
   COMPLETED
   REFUNDED
   FAILED
   }

NOTE

Every table with tenantId will have Row-Level Security (RLS) policies applied via Prisma middleware or PostgreSQL policies. The TenantInterceptor in NestJS sets the tenant context from the JWT token on every request.

2. NestJS Module Structure (per domain module)

Each domain module follows this pattern:

modules/pet/
├── pet.module.ts # NestJS module with imports/exports
├── pet.controller.ts # REST endpoints
├── pet.service.ts # Business logic
├── dto/
│ ├── create-pet.dto.ts # Zod-validated DTOs
│ └── update-pet.dto.ts
└── pet.controller.spec.ts

Example — Pet Controller:

typescript
// modules/pet/pet.controller.ts
@Controller('pets')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PetController {
constructor(private readonly petService: PetService) {}
@Post()
@Roles(Role.OWNER, Role.ADMIN, Role.VETERINARIAN, Role.RECEPTIONIST)
create(
@CurrentTenant() tenantId: string,
@Body(new ZodValidationPipe(CreatePetSchema)) dto: CreatePetDto,
) {
return this.petService.create(tenantId, dto);
}
@Get()
findAll(
@CurrentTenant() tenantId: string,
@Query() query: PetQueryDto,
) {
return this.petService.findAll(tenantId, query);
}
@Get(':id')
findOne(
@CurrentTenant() tenantId: string,
@Param('id') id: string,
) {
return this.petService.findOne(tenantId, id);
}
} 3. Integration Adapter Architecture

NestJS DI wiring:

typescript
// integrations/prro/prro.module.ts
@Module({
providers: [
{
provide: 'PRRO_ADAPTER',
useFactory: (config: ConfigService) => {
const provider = config.get('PRRO_PROVIDER');
switch (provider) {
case 'checkbox': return new CheckboxAdapter(config);
case 'prro-ua': return new PrroUaAdapter(config);
default: throw new Error(`Unknown PRRO provider: ${provider}`);
}
},
inject: [ConfigService],
},
],
exports: ['PRRO_ADAPTER'],
})
export class PrroModule {} 4. Frontend Architecture (Next.js App Router)

Key frontend libraries:

Library Purpose
shadcn/ui + Tailwind CSS UI components
@tanstack/react-query Server state
zustand Client state
react-hook-form + zod Forms & validation
next-intl i18n (uk/en)
recharts Charts & BI
@dnd-kit/core Kanban drag & drop
date-fns Date manipulation (uk locale)
next-pwa PWA support 5. Adaptive UI & High-Resolution Display Architecture (Mobile to 2K/4K/Ultrawide)

Veterinary clinics use varied hardware: receptionists and doctors use 24"-32" 2K (2560x1440) or 4K monitors to view complex schedules and X-rays, while assistants and on-call vets use tablets and mobile phones.

Breakpoint Matrix
Token Breakpoint Target Devices Layout Behavior
xs < 480px Small phones (iPhone SE, etc.) Single column, sticky bottom navigation bar, full-screen sheet modals, card lists instead of tables.
sm 480px - 640px Large phones Single column with 2-item compact grids, bottom nav, 44px min tap targets.
md 640px - 1024px Tablets & iPads Collapsible sidebar drawer, 2-column dashboard grids, swipeable tabs.
lg 1024px - 1536px Standard Laptops & FHD Desktops (1080p) Persistent sidebar, 3-column dashboard, standard data tables with sticky headers.
2xl 1536px - 2560px 2K QHD Monitors (27" 1440p) Multi-panel layout: Persistent sidebar + dual/triple clinical panels side-by-side; Calendar shows 6-8 doctor columns simultaneously; Kanban shows all 8 stages without horizontal scrolling.
3xl > 2560px 4K UHD (3840x2160) & Ultrawide (21:9 / 32:9) Panoramic Clinical Workspace: Left panel (Pet profile & vitals), Center panel (Active visit SOAP note editor), Right panel (DICOM/X-ray viewer & lab history) displayed concurrently; fluid container bounds (max-w-[2560px] centered); data density controls (compact/comfortable).
2K+ High-Resolution Specialized Layouts

Multi-panel Clinical Consultation View (2K/4K):

Column 1 (280px): Compact collapsible clinic navigation.
Column 2 (380px): Patient card, vital signs history, active alerts (allergies, chronic conditions).
Column 3 (Flex 1, min 650px): Active visit form (Complaint → Objective examination → Diagnosis → Treatment & Prescriptions).
Column 4 (Flex 1, min 600px): Diagnostic split-view (DICOM viewer, lab tests, vaccination history timeline) — eliminating context switching between browser tabs.

Expanded Scheduler / Calendar View (2K/4K):

Displays 6 to 10 veterinarian columns side-by-side with 15-minute slot increments.
Side panel for quick unscheduled appointment queue and waiting room status.

Full-Funnel Kanban Pipeline (2K/Ultrawide):

All 8-9 status columns (New → Diagnostics → Pending Approval → Client Approved → Waiting Parts → In Progress → Completed → Paid) fit horizontally with comfortable card widths (~280px each), completely removing horizontal scrolling fatigue.

Fluid Typography & UI Density Controls:

Dynamic scaling with rem and CSS variables.
Data density switch in workspace header: Compact (12px text, 28px row height for high-volume reception) vs Standard (14px text, 40px row height for clinical documentation).
Phase 1 — MVP (Months 1–4)
Month 1: Foundation
Week 1–2: Project scaffolding
Initialize Turborepo monorepo
Set up NestJS app (apps/api) with Prisma, PostgreSQL
Set up Next.js app (apps/web) with Tailwind, shadcn/ui, next-intl
Set up packages/shared with Zod schemas and types
Docker Compose for local dev (PostgreSQL, Redis, API, Web)
ESLint, Prettier, Husky pre-commit hooks
CI pipeline (GitHub Actions): lint, typecheck, test
Initial Prisma schema: Tenant, User tables
Seed script with demo tenant and users
Week 3–4: Auth & RBAC
JWT authentication (access + refresh tokens)
Login / Register pages
Role-based access control (Owner, Admin, Veterinarian, Assistant, Receptionist)
Tenant middleware — inject tenantId from JWT on every request
User management page (invite, deactivate, change role)
Password reset flow (email)
Protected routes (frontend middleware)
Month 2: Core Entities
Week 5–6: Clients & Pets (CRM)
Prisma schema: Client, Pet
CRUD API for clients (search, pagination, filters)
CRUD API for pets (linked to client)
Client list page with search & filters
Client detail page (profile + linked pets)
Pet detail page (profile card, species/breed/weight)
Quick-add client+pet flow (single form)
Import clients from CSV
Week 7–8: Medical Records & Vaccinations
Prisma schema: MedicalRecord, Vaccination
CRUD API for medical records (linked to pet + veterinarian)
CRUD API for vaccinations (linked to pet)
Medical record form (complaint → anamnesis → exam → diagnosis → treatment)
Vaccination schedule view (per pet, upcoming reminders)
Vaccination calendar (cross-pet, next-due-date based)
File attachment support (images, PDFs) — S3-compatible storage (MinIO for self-hosted)
Pet timeline view (all records + vaccinations chronologically)
Month 3: Scheduling & Inventory
Week 9–10: Appointments & Calendar
Prisma schema: Appointment
CRUD API for appointments (with conflict detection)
Weekly calendar view (per veterinarian columns)
Daily schedule view
Drag & resize appointments
Public booking page (/[tenant-slug]/book) — SSR, no auth
Booking widget: select service → select vet → pick time slot → enter contact
Auto-create client+pet on first online booking
Week 11–12: Basic Inventory
Prisma schema: InventoryItem, InventoryMovement
CRUD API for inventory items
Stock receipt (batch add with cost price)
Manual consumption (deduct fractional amounts: 0.5 ml, 0.25 tablet)
Low stock alerts (threshold-based)
Inventory list with search, category filter, expiry warning
Stock movement history
Month 4: Polish & Deploy MVP
Week 13–14: Integration & Testing
E2E tests (Playwright): auth flow, create client+pet, create appointment
API integration tests (Jest + Supertest)
i18n: complete Ukrainian and English translations
PWA manifest, service worker, offline indicator
Responsive layout testing (mobile, tablet, desktop)
Error handling: global error boundary, toast notifications
Loading states, empty states, 404 pages
Week 15–16: Deployment
Docker production images (multi-stage build)
Docker Compose production config (Traefik reverse proxy, SSL)
PostgreSQL backup cron job
Environment variable management (.env.example, validation)
Health check endpoints
Logging (structured JSON, correlation IDs)
Deploy to VPS (Hetzner) — first SaaS instance
AGENTS.md rewrite for new stack
DOCUMENTATION/ files: README, ARCHITECTURE, DEVELOPMENT, API, SECURITY, TESTING
Phase 2 — Core Business (Months 5–8)
Month 5: Finance & PRRO
Prisma schema: Payment, OrderItem
Payment CRUD (cash, card, transfer)
PRRO adapter interface
Checkbox integration (open shift, create receipt, close shift)
pRRO.ua integration (same interface)
Cash register page (open/close shift, receipt list)
Payment modal on order completion
Daily/monthly financial reports (revenue, expenses, profit)
Refund flow
Month 6: Kanban Workflows & Orders
Prisma schema: Order, OrderItem
Order CRUD API (create, update status, assign veterinarian)
Kanban board page (drag & drop between columns)
Column order: New → Diagnostics → Pending Approval → Client Approved → Waiting Parts → In Progress → Completed → Paid
Order card: client, pet, items/services, total, assigned vet, timestamps
Order detail page (edit items, add inventory consumption, add payments)
Auto-deduct inventory on order item consumption
Order number auto-generation (V000001)
Order filters (by status, date, vet, client)
Month 7: Notifications
Notification module with adapter pattern
Telegram Bot adapter (register bot, webhook, send messages)
SMS adapter (TurboSMS integration)
Email adapter (Resend or Nodemailer)
Push adapter (Web Push API / PWA)
Notification templates (appointment reminder, vaccination due, order status)
Scheduled notifications (cron: send reminders 24h before appointment)
Client notification preferences (per-channel opt-in)
Notification log (sent/failed/read)
Month 8: Print Forms
Print form engine (HTML templates → PDF via Puppeteer or @react-pdf/renderer)
Invoice/receipt print
Vaccination certificate
Treatment protocol
Medical report / справка
Custom template editor (basic — logo, clinic info, footer)
Thermal printer support (receipt printer via browser print dialog)
Phase 3 — Advanced (Months 9–14+)
Month 9–10: Diagnostics Integration
Diagnostic adapter interface
Manual file upload (DICOM, images, PDF lab results)
File viewer (DICOM viewer library: cornerstone.js or dwv.js)
Lab results attachment to medical records
Image annotation (basic markup for X-rays)
API adapter template for lab equipment vendors
Month 11–12: BI Dashboards
Dashboard framework (widget-based layout)
Revenue analytics (by period, service, veterinarian)
Client analytics (new vs returning, lifetime value)
Pet analytics (species distribution, most common diagnoses)
Inventory analytics (turnover rate, cost analysis, expiry risk)
Appointment analytics (utilization, no-show rate, peak hours)
Veterinarian workload dashboard
Export reports (PDF, Excel)
Custom date range filters, comparison periods
Month 13–14: Multi-tenant Billing & Self-hosted
Tenant onboarding flow (register clinic → create tenant → add users)
Billing module (Stripe subscription + LiqPay + Monobank)
Plan management (TRIAL → BASIC → PRO → ENTERPRISE)
Usage limits by plan (if any)
Billing portal (invoices, payment history, plan change)
Stripe webhook handling (subscription created, payment failed, etc.)
Self-hosted Docker package:
Single docker-compose.selfhosted.yml
Auto-setup script (generate secrets, init DB, create admin)
Documentation for self-hosted deployment
License key verification (optional)
Admin super-panel (manage all tenants — SaaS operator view)
Database Architecture
Security Architecture
Layer Mechanism
Authentication JWT (access token 15min + refresh token 7d)
Authorization Role-based guards (@Roles() decorator)
Tenant isolation TenantGuard + Prisma middleware filter by tenantId
Input validation Zod schemas (shared between frontend & backend)
CSRF SameSite cookies for refresh token
Rate limiting @nestjs/throttler
CORS Whitelist per tenant domain
Data encryption HTTPS (Traefik + Let's Encrypt), bcrypt passwords
Audit log Interceptor logs all write operations
API Design

RESTful API with consistent patterns:

Base URL: /api/v1
Auth:
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
Clients:
GET /clients (list, paginated, search)
GET /clients/:id (detail)
POST /clients (create)
PATCH /clients/:id (update)
DELETE /clients/:id (soft delete)
Pets:
GET /clients/:clientId/pets (pets by client)
GET /pets/:id (detail with medical history)
POST /pets (create)
PATCH /pets/:id (update)
Medical Records:
GET /pets/:petId/records (records by pet)
POST /medical-records (create)
PATCH /medical-records/:id (update)
Vaccinations:
GET /pets/:petId/vaccinations (by pet)
GET /vaccinations/upcoming (upcoming across all pets)
POST /vaccinations (create)
Appointments:
GET /appointments (list, filters: date range, vet, status)
GET /appointments/calendar (calendar view data)
POST /appointments (create)
PATCH /appointments/:id (update / change status)
Inventory:
GET /inventory (list, search, filters)
POST /inventory (create item)
PATCH /inventory/:id (update)
POST /inventory/:id/movements (record movement)
GET /inventory/low-stock (alerts)
Orders:
GET /orders (list, kanban data)
POST /orders (create)
PATCH /orders/:id (update)
PATCH /orders/:id/status (change status)
POST /orders/:id/items (add item)
POST /orders/:id/payments (add payment)
Finance:
GET /finance/summary (period summary)
POST /finance/prro/shift/open (open PRRO shift)
POST /finance/prro/shift/close (close PRRO shift)
POST /finance/prro/receipt (create fiscal receipt)
Notifications:
GET /notifications (user notification log)
PATCH /notifications/:id/read (mark as read)
Reports:
GET /reports/revenue (revenue analytics)
GET /reports/clients (client analytics)
GET /reports/appointments (appointment analytics)
GET /reports/inventory (inventory analytics)
Public (no auth):
GET /public/:tenantSlug/info (clinic info for booking page)
GET /public/:tenantSlug/slots (available time slots)
POST /public/:tenantSlug/book (create booking)
Verification Plan
Automated Tests
bash

# All tests

turbo test

# Backend only

cd apps/api && npm test

# Frontend only

cd apps/web && npm test

# E2E

cd apps/web && npx playwright test

# Type checking

turbo typecheck

# Lint

turbo lint
Manual Verification

Per phase, manually verify:

Phase 1 (MVP):

Register new clinic → login → see empty dashboard
Create client → add pet → create medical record → add vaccination
Schedule appointment (internal) → see it on calendar
Book appointment (public page) → verify it appears in internal calendar
Add inventory items → consume fractional amount → verify stock deduction
Test responsive layout across full viewport spectrum: mobile (375px / 390px), tablet (768px / 1024px), standard desktop (1080p), 2K QHD (2560x1440), and 4K / ultrawide (>2560px) — verify multi-panel split views, expanded doctor calendar columns, and full kanban visibility without unnecessary horizontal scrolling.
Switch UI language (UK ↔ EN)
PWA: install on mobile → verify offline indicator

Phase 2:

Create order → drag through kanban stages → add items → pay → close
Open PRRO shift → create receipt → close shift (Checkbox sandbox)
Receive notification (Telegram, SMS, Email, Push) for appointment reminder
Print vaccination certificate → verify PDF output

Phase 3:

Upload DICOM file → view in viewer → attach to medical record
Dashboard: verify revenue, client, appointment charts render with real data
Register second clinic (multi-tenant) → verify data isolation
Deploy self-hosted Docker → run setup script → verify clean install
Risk Mitigation
Risk Mitigation
Scope creep Strict phase gates. No Phase 2 work until Phase 1 deploys.
Solo developer burnout 2 weeks buffer per phase. No weekend work policy.
Stack unfamiliarity (NestJS/Prisma) First 2 weeks dedicated to scaffolding & learning.
PRRO integration complexity Start with Checkbox sandbox API early. Allocate extra week.
Data isolation bugs Prisma middleware enforcing tenantId on every query from day 1.
Performance at scale Indexes on tenantId + key columns. Load test before Phase 3.
Competitor moves Focus on UX and Ukrainian market fit over feature count.
