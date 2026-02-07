-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BANK_DEPOSIT';
ALTER TYPE "AuditAction" ADD VALUE 'BANK_WITHDRAW';
ALTER TYPE "AuditAction" ADD VALUE 'BANK_TRANSFER';
ALTER TYPE "AuditAction" ADD VALUE 'SOCIAL_CREDIT_ADDED';
ALTER TYPE "AuditAction" ADD VALUE 'SOCIAL_CREDIT_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'GOVERNMENT_ROLE_ADDED';
ALTER TYPE "AuditAction" ADD VALUE 'GOVERNMENT_ROLE_REMOVED';
