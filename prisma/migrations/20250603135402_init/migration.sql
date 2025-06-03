-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "jobcanEmail" TEXT NOT NULL,
    "jobcanPassword" TEXT NOT NULL,
    "weekdaysOnly" BOOLEAN NOT NULL DEFAULT true,
    "checkInTime" TEXT NOT NULL DEFAULT '09:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '18:00',
    "schedulerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "checkInDelay" INTEGER NOT NULL DEFAULT -10,
    "checkOutDelay" INTEGER NOT NULL DEFAULT 5,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "messageLanguage" TEXT NOT NULL DEFAULT 'ko',
    "telegramBotToken" TEXT NOT NULL DEFAULT '',
    "telegramChatId" TEXT NOT NULL DEFAULT '',
    "annualLeaveCalendarUrl" TEXT NOT NULL DEFAULT '',
    "annualLeaveKeyword" TEXT NOT NULL DEFAULT '연차',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
