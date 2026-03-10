-- CreateTable
CREATE TABLE "Calculation" (
    "id" SERIAL NOT NULL,
    "expression" TEXT NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);
