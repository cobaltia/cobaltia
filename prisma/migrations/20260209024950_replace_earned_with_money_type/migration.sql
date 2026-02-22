/*
  Warnings:

  - You are about to drop the column `earned` on the `money_history` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MoneyType" AS ENUM ('EARNED', 'LOST', 'NEUTRAL');

-- AlterTable
ALTER TABLE "money_history" DROP COLUMN "earned",
ADD COLUMN     "type" "MoneyType" NOT NULL DEFAULT 'EARNED';
