-- CreateTable
CREATE TABLE "allowed_email" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_email_pattern_key" ON "allowed_email"("pattern");
