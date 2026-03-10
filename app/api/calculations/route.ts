import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const calculations = await prisma.calculation.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(calculations);
}

export async function POST(request: Request) {
  const { expression, result } = await request.json();

  if (!expression || result === undefined) {
    return NextResponse.json(
      { error: "expression and result are required" },
      { status: 400 }
    );
  }

  const calculation = await prisma.calculation.create({
    data: { expression, result },
  });

  return NextResponse.json(calculation, { status: 201 });
}
