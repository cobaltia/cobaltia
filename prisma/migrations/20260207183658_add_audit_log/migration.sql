-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('COMMAND_SUCCESS', 'COMMAND_ERROR', 'MONEY_EARNED', 'MONEY_LOST', 'EXPERIENCE_GAINED', 'LEVEL_UP', 'ITEM_BOUGHT', 'ITEM_SOLD', 'ITEM_USED');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20),
    "channel_id" VARCHAR(20),
    "target_id" VARCHAR(50),
    "target_type" VARCHAR(20),
    "metadata" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_guild_id_idx" ON "audit_log"("guild_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");
