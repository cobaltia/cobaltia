-- AlterTable
ALTER TABLE "client" ADD COLUMN     "executives" TEXT[] DEFAULT ARRAY[]::TEXT[];
