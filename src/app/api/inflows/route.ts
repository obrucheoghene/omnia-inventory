import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { inflows, materials, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createInflowSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - List all inflows with related data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const allInflows = await db
      .select({
        id: inflows.id,
        materialId: inflows.materialId,
        materialName: materials.name,
        unitId: inflows.unitId,
        projectId: inflows.projectId,
        quantity: inflows.quantity,
        unitPrice: inflows.unitPrice,
        totalValue: inflows.totalValue,
        deliveryDate: inflows.deliveryDate,
        receivedBy: inflows.receivedBy,
        supplierName: inflows.supplierName,
        purpose: inflows.purpose,
        supportDocument: inflows.supportDocument,
        batchNumber: inflows.batchNumber,
        expiryDate: inflows.expiryDate,
        createdAt: inflows.createdAt,
        updatedAt: inflows.updatedAt,
      })
      .from(inflows)
      .leftJoin(materials, eq(inflows.materialId, materials.id))
      .orderBy(desc(inflows.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(allInflows);
  } catch (error) {
    console.error("Error fetching inflows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new inflow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createInflowSchema.parse(body);

    // Calculate total value if unit price is provided
    const totalValue = validatedData.unitPrice
      ? validatedData.quantity * validatedData.unitPrice
      : null;

    // Prepare inflow data
    const inflowData = {
      materialId: validatedData.materialId,
      unitId: validatedData.unitId,
      projectId: validatedData.projectId,
      quantity: validatedData.quantity?.toString(), // Keep as number
      unitPrice: validatedData.unitPrice?.toString(), // Keep as number
      totalValue: totalValue?.toString(), // Keep as number
      deliveryDate: new Date(validatedData.deliveryDate),
      receivedBy: validatedData.receivedBy,
      supplierName: validatedData.supplierName,
      purpose: validatedData.purpose,
      batchNumber: validatedData.batchNumber,
      expiryDate: validatedData.expiryDate
        ? new Date(validatedData.expiryDate)
        : null,
      supportDocument: validatedData.supportDocument,
      createdBy: session.user.id,
    };

    const [newInflow] = await db.insert(inflows).values(inflowData).returning();

    return NextResponse.json(newInflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error creating inflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
