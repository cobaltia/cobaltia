-- AlterTable
ALTER TABLE "client" ADD COLUMN     "ministers" TEXT[] DEFAULT ARRAY[]::TEXT[];
