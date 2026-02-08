/*
  Warnings:

  - You are about to drop the column `channel_id` on the `audit_log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "channel_id";
