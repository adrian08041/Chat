-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "Instance" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "color" TEXT NOT NULL DEFAULT '#075E54',
    "status" "InstanceStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "uazapiSubdomain" TEXT NOT NULL,
    "uazapiToken" TEXT NOT NULL,
    "uazapiInstanceId" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "msgDelayMin" INTEGER NOT NULL DEFAULT 2,
    "msgDelayMax" INTEGER NOT NULL DEFAULT 6,
    "proxyUrl" TEXT,
    "lastConnectedAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instance_webhookSecret_key" ON "Instance"("webhookSecret");

-- CreateIndex
CREATE INDEX "Instance_workspaceId_status_idx" ON "Instance"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Instance_workspaceId_deletedAt_idx" ON "Instance"("workspaceId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
