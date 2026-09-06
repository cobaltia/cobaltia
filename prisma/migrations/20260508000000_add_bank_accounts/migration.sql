-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('BANK', 'BROKERAGE');

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id"         TEXT NOT NULL,
    "user_id"    VARCHAR(20) NOT NULL,
    "balance"    DECIMAL(65,30) NOT NULL DEFAULT 0,
    "limit"      DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "type"       "AccountType" NOT NULL DEFAULT 'BANK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_user_id_type_key" ON "bank_accounts"("user_id", "type");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: seed one BANK account per existing user
INSERT INTO "bank_accounts" ("id", "user_id", "balance", "limit", "type", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", "bank_balance", "bank_limit", 'BANK', NOW(), NOW()
FROM "users";

-- DataMigration: re-point bank_transactions to bank_accounts
ALTER TABLE "bank_transactions" ADD COLUMN "new_account_id" TEXT;

UPDATE "bank_transactions" bt
SET "new_account_id" = ba."id"
FROM "bank_accounts" ba
WHERE ba."user_id" = bt."account_id"
  AND ba."type" = 'BANK';

-- SwapColumn: replace account_id with the new one
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_account_id_fkey";
ALTER TABLE "bank_transactions" DROP COLUMN "account_id";
ALTER TABLE "bank_transactions" RENAME COLUMN "new_account_id" TO "account_id";
ALTER TABLE "bank_transactions" ALTER COLUMN "account_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: remove now-redundant columns from users
ALTER TABLE "users"
    DROP COLUMN "bank_balance",
    DROP COLUMN "bank_limit";
