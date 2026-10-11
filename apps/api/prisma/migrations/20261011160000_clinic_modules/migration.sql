-- CreateEnum
CREATE TYPE "ClinicPlan" AS ENUM ('trial', 'basic', 'pro');
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'done', 'cancelled');
CREATE TYPE "InvoiceKind" AS ENUM ('sale', 'subscription');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'paid', 'void');
CREATE TYPE "PaymentProviderId" AS ENUM ('stripe', 'liqpay', 'monobank');
CREATE TYPE "FiscalProviderId" AS ENUM ('checkbox', 'prro_ua');
CREATE TYPE "NotifyChannel" AS ENUM ('telegram', 'sms', 'email', 'push');
CREATE TYPE "DiagnosticSource" AS ENUM ('manual', 'generic_analyzer');

ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "plan" "ClinicPlan" NOT NULL DEFAULT 'trial';
ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '14 days';
UPDATE "Tenant" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Patient" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "species" TEXT NOT NULL,
  "breed" TEXT NOT NULL DEFAULT '',
  "sex" TEXT NOT NULL DEFAULT '',
  "birthDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicalRecord" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "complaint" TEXT NOT NULL,
  "findings" TEXT NOT NULL DEFAULT '',
  "diagnosis" TEXT NOT NULL DEFAULT '',
  "treatment" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vaccination" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "vaccine" TEXT NOT NULL,
  "givenAt" TIMESTAMP(3) NOT NULL,
  "nextDueAt" TIMESTAMP(3),
  "batch" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "staffId" TEXT,
  "start" TIMESTAMP(3) NOT NULL,
  "end" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
  "note" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL DEFAULT 'clinic',
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "threshold" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "authorId" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "kind" "InvoiceKind" NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
  "plan" "ClinicPlan",
  "totalKop" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceLine" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "unitKop" INTEGER NOT NULL,
  CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "provider" "PaymentProviderId" NOT NULL,
  "externalId" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalReceipt" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "provider" "FiscalProviderId" NOT NULL,
  "externalId" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FiscalReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationMessage" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "channel" "NotifyChannel" NOT NULL,
  "destination" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "payload" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'queued',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "source" "DiagnosticSource" NOT NULL,
  "title" TEXT NOT NULL,
  "modality" TEXT NOT NULL DEFAULT '',
  "fileName" TEXT NOT NULL DEFAULT '',
  "storageKey" TEXT NOT NULL DEFAULT '',
  "payload" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiagnosticStudy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");
CREATE INDEX "Patient_tenantId_idx" ON "Patient"("tenantId");
CREATE INDEX "Patient_clientId_idx" ON "Patient"("clientId");
CREATE INDEX "MedicalRecord_tenantId_idx" ON "MedicalRecord"("tenantId");
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");
CREATE INDEX "Vaccination_tenantId_idx" ON "Vaccination"("tenantId");
CREATE INDEX "Vaccination_patientId_idx" ON "Vaccination"("patientId");
CREATE INDEX "Appointment_tenantId_start_idx" ON "Appointment"("tenantId", "start");
CREATE INDEX "InventoryItem_tenantId_idx" ON "InventoryItem"("tenantId");
CREATE INDEX "StockMovement_tenantId_idx" ON "StockMovement"("tenantId");
CREATE INDEX "StockMovement_itemId_idx" ON "StockMovement"("itemId");
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");
CREATE INDEX "InvoiceLine_tenantId_idx" ON "InvoiceLine"("tenantId");
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX "FiscalReceipt_tenantId_idx" ON "FiscalReceipt"("tenantId");
CREATE INDEX "NotificationMessage_tenantId_idx" ON "NotificationMessage"("tenantId");
CREATE INDEX "DiagnosticStudy_tenantId_idx" ON "DiagnosticStudy"("tenantId");
CREATE INDEX "DiagnosticStudy_patientId_idx" ON "DiagnosticStudy"("patientId");

ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalReceipt" ADD CONSTRAINT "FiscalReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiagnosticStudy" ADD CONSTRAINT "DiagnosticStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Forced RLS. The API sets app.tenant_id inside withTenant only.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Client','Patient','MedicalRecord','Vaccination','Appointment','InventoryItem',
    'StockMovement','Invoice','InvoiceLine','Payment','FiscalReceipt',
    'NotificationMessage','DiagnosticStudy'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%s ON %I USING (current_setting(''app.bypass_rls'', true) = ''on'' OR "tenantId" = current_setting(''app.tenant_id'', true)) WITH CHECK (current_setting(''app.bypass_rls'', true) = ''on'' OR "tenantId" = current_setting(''app.tenant_id'', true))',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE FUNCTION public_clinic_by_slug(lookup_slug text)
RETURNS TABLE (id text, name text, slug text, plan "ClinicPlan")
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.plan FROM "Tenant" t WHERE t.slug = lookup_slug
$$;

REVOKE ALL ON FUNCTION public_clinic_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_clinic_by_slug(text) TO vetsync_app;
