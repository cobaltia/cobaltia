-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'GUILD', 'CHANNEL');

-- CreateTable
CREATE TABLE "discord_entities" (
    "id" VARCHAR(20) NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discord_entities_type_idx" ON "discord_entities"("type");
