/*
  Warnings:

  - The primary key for the `inventories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bank_note` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `cobuck` on the `inventories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,item_id]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `item_id` to the `inventories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `inventories` table without a default value. This is not possible if the table is not empty.

*/
-- Drop inventories
DROP TABLE IF EXISTS "inventories";

-- Recreate inventories
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "item_id" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "user_id" VARCHAR(20) NOT NULL,
    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventories_user_id_item_id_key" ON "inventories"("user_id", "item_id");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
