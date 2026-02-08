-- AlterTable: add columns with a default for existing rows, then remove default
ALTER TABLE "experience_history" ADD COLUMN "guild_id" VARCHAR(20) NOT NULL DEFAULT 'unknown',
ADD COLUMN "channel_id" VARCHAR(20) NOT NULL DEFAULT 'unknown';

-- Remove defaults so future inserts require the value
ALTER TABLE "experience_history" ALTER COLUMN "guild_id" DROP DEFAULT,
ALTER COLUMN "channel_id" DROP DEFAULT;
