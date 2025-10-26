/*
  Warnings:

  - You are about to alter the column `amount` on the `bank_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `tax` on the `client` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `bank_balance` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `bank_limit` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `wallet` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `bounty` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `earned` on the `voices` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "bank_transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "client" ALTER COLUMN "bank_balance" SET DEFAULT 0,
ALTER COLUMN "bank_balance" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "bank_balance" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "bank_limit" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "wallet" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "bounty" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "voices" ALTER COLUMN "earned" SET DATA TYPE DECIMAL(65,30);
