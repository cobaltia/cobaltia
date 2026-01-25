/*
  Warnings:

  - A unique constraint covering the columns `[user_id,item_id]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "inventories_user_id_item_id_key" ON "inventories"("user_id", "item_id");
