-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "consentEssentialStorage" BOOLEAN NOT NULL DEFAULT false,
    "consentReminders" BOOLEAN NOT NULL DEFAULT false,
    "consentCaregiverAlerts" BOOLEAN NOT NULL DEFAULT false,
    "consentSmsWhatsappFallback" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "times" TEXT NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "actedAt" DATETIME,
    "notifiedAt" DATETIME,
    "escalatedAt" DATETIME,
    CONSTRAINT "DoseEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DoseEvent_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Caregiver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "doseEventId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivery" TEXT NOT NULL DEFAULT 'logged',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DoseEvent_userId_scheduledFor_idx" ON "DoseEvent"("userId", "scheduledFor");
