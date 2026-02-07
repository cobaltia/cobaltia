-- CreateEnum
CREATE TYPE "MoneyReason" AS ENUM ('BOUNTY_CLAIM', 'DAILY', 'DEATH', 'GAMBLING', 'ROB', 'STORE', 'TAX', 'VOICE', 'WORK');

-- CreateEnum
CREATE TYPE "ExperienceReason" AS ENUM ('MESSAGE', 'VOICE');

-- CreateEnum
CREATE TYPE "ItemAction" AS ENUM ('BUY', 'SELL', 'USE');

-- CreateTable
CREATE TABLE "command_history" (
    "id" TEXT NOT NULL,
    "command" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "command_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_history" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "command" VARCHAR(50) NOT NULL,
    "reason" "MoneyReason" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "earned" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_history" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "reason" "ExperienceReason" NOT NULL,
    "amount" INTEGER NOT NULL,
    "level_up" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_history" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_history" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "item_id" VARCHAR(20) NOT NULL,
    "action" "ItemAction" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "command_history_user_id_idx" ON "command_history"("user_id");

-- CreateIndex
CREATE INDEX "command_history_guild_id_idx" ON "command_history"("guild_id");

-- CreateIndex
CREATE INDEX "money_history_user_id_idx" ON "money_history"("user_id");

-- CreateIndex
CREATE INDEX "money_history_reason_idx" ON "money_history"("reason");

-- CreateIndex
CREATE INDEX "experience_history_user_id_idx" ON "experience_history"("user_id");

-- CreateIndex
CREATE INDEX "experience_history_reason_idx" ON "experience_history"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "message_history_user_id_guild_id_channel_id_date_key" ON "message_history"("user_id", "guild_id", "channel_id", "date");

-- CreateIndex
CREATE INDEX "item_history_user_id_idx" ON "item_history"("user_id");

-- CreateIndex
CREATE INDEX "item_history_item_id_idx" ON "item_history"("item_id");
