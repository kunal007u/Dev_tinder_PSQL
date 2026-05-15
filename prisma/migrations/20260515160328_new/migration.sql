-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('ignore', 'interested', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(30) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "skills" VARCHAR(100)[],
    "alreadyConnected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectionRequestSchema" (
    "id" SERIAL NOT NULL,
    "loggedInUserId" INTEGER NOT NULL,
    "randomPersonId" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connectionRequestSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedSchema" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "feedSchema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "connectionRequestSchema_loggedInUserId_randomPersonId_idx" ON "connectionRequestSchema"("loggedInUserId", "randomPersonId");

-- AddForeignKey
ALTER TABLE "connectionRequestSchema" ADD CONSTRAINT "connectionRequestSchema_loggedInUserId_fkey" FOREIGN KEY ("loggedInUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectionRequestSchema" ADD CONSTRAINT "connectionRequestSchema_randomPersonId_fkey" FOREIGN KEY ("randomPersonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
