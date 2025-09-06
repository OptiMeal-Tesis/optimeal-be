-- CreateEnum
CREATE TYPE "public"."ProductTypeEnum" AS ENUM ('FOOD', 'BEVERAGE');

-- CreateEnum
CREATE TYPE "public"."RestrictionEnum" AS ENUM ('GLUTEN_FREE', 'LACTOSE_FREE', 'SUGAR_FREE', 'VEGAN');

-- CreateEnum
CREATE TYPE "public"."UserTypeEnum" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "national_id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserTypeEnum" NOT NULL DEFAULT 'USER',
    "cognito_sub" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "photo" TEXT,
    "restrictions" "public"."RestrictionEnum"[] DEFAULT ARRAY[]::"public"."RestrictionEnum"[],
    "sides" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "admitsClarifications" BOOLEAN NOT NULL DEFAULT false,
    "type" "public"."ProductTypeEnum" NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_national_id_key" ON "public"."User"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_cognito_sub_key" ON "public"."User"("cognito_sub");
