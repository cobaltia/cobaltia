-- CreateEnum
CREATE TYPE "Transaction" AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRANSFER');

-- CreateTable
CREATE TABLE "client" (
    "id" VARCHAR(20) NOT NULL,
    "bank_balance" INTEGER NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 7,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" VARCHAR(20) NOT NULL,
    "log_channel_id" VARCHAR(20),
    "welcome_channel_id" VARCHAR(20),
    "voice_channel_id" VARCHAR(20),
    "welcome_message" TEXT NOT NULL DEFAULT 'Welcome to {guild}, {user}!',

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(20) NOT NULL,
    "guilds" TEXT[],
    "bank_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bank_limit" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "wallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "social_credit" INTEGER NOT NULL DEFAULT 1000,
    "work_cooldown" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" VARCHAR(20) NOT NULL,
    "bank_note" INTEGER NOT NULL DEFAULT 0,
    "cobuck" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voices" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "channel_id" VARCHAR(20) NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "earned" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "voices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "Transaction" NOT NULL,
    "description" TEXT[],
    "account_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voices" ADD CONSTRAINT "voices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
