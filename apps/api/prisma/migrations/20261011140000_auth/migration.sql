-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('owner', 'veterinarian', 'assistant');

-- AlterTable
DROP INDEX "User_tenantId_email_key";

ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "role" "StaffRole" NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Login cannot set app.tenant_id before it knows the clinic.
-- The function owner bypasses RLS. The API role may only execute it.
CREATE FUNCTION auth_find_user_by_email(lookup_email text)
RETURNS TABLE (
  id text,
  "tenantId" text,
  email text,
  name text,
  "passwordHash" text,
  role "StaffRole"
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u."tenantId", u.email, u.name, u."passwordHash", u.role
  FROM "User" u
  WHERE u.email = lookup_email
$$;

REVOKE ALL ON FUNCTION auth_find_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_find_user_by_email(text) TO vetsync_app;
