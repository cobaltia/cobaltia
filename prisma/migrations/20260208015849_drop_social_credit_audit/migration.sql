-- Delete rows referencing enum values about to be removed
DELETE FROM "audit_log"
WHERE "action" IN ('SOCIAL_CREDIT_ADDED', 'SOCIAL_CREDIT_REMOVED');

-- Delete rows with null guild_id before making it non-nullable
DELETE FROM "audit_log" WHERE "guild_id" IS NULL;

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('GOVERNMENT_ROLE_ADDED', 'GOVERNMENT_ROLE_REMOVED', 'GUILD_SETTING_UPDATED');
ALTER TABLE "audit_log" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- AlterTable
ALTER TABLE "audit_log" ALTER COLUMN "guild_id" SET NOT NULL;
