-- Delete rows referencing enum values about to be removed
DELETE FROM "audit_log"
WHERE "action" IN (
  'COMMAND_SUCCESS', 'COMMAND_ERROR',
  'MONEY_EARNED', 'MONEY_LOST',
  'EXPERIENCE_GAINED', 'LEVEL_UP',
  'ITEM_BOUGHT', 'ITEM_SOLD', 'ITEM_USED',
  'BANK_DEPOSIT', 'BANK_WITHDRAW', 'BANK_TRANSFER'
);

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('SOCIAL_CREDIT_ADDED', 'SOCIAL_CREDIT_REMOVED', 'GOVERNMENT_ROLE_ADDED', 'GOVERNMENT_ROLE_REMOVED', 'GUILD_SETTING_UPDATED');
ALTER TABLE "audit_log" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;
