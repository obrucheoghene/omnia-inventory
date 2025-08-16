import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { outflows, materials, units, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createOutflowSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { getMaterialStock } from "@/lib/db/inventory-queries";
import { z } from "zod";

// GET - List all outflows with related data
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

    const allOutflows = await db
      .select({
        id: outflows.id,
        materialId: outflows.materialId,
        materialName: materials.name,
        unitId: outflows.unitId,
        unitName: units.name,
        projectId: outflows.projectId,
        projectName: projects.name,
        quantity: outflows.quantity,
        unitPrice: outflows.unitPrice,
        totalValue: outflows.totalValue,
        releaseDate: outflows.releaseDate,
        authorizedBy: outflows.authorizedBy,
        receivedBy: outflows.receivedBy,
        purpose: outflows.purpose,
        supportDocument: outflows.supportDocument,
        returnDate: outflows.returnDate,
        isReturned: outflows.isReturned,
        createdAt: outflows.createdAt,
        updatedAt: outflows.updatedAt,
      })
      .from(outflows)
      .leftJoin(materials, eq(outflows.materialId, materials.id))
      .leftJoin(units, eq(outflows.unitId, units.id))
      .leftJoin(projects, eq(outflows.projectId, projects.id))
      .orderBy(desc(outflows.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(allOutflows);
  } catch (error) {
    console.error("Error fetching outflows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new outflow
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
    const validatedData = createOutflowSchema.parse(body);

    // Check if there's sufficient stock
    const materialStock = await getMaterialStock(
      validatedData.materialId,
      validatedData.unitId
    );

    if (!materialStock) {
      return NextResponse.json(
        { error: "Material not found or no stock data available" },
        { status: 400 }
      );
    }

    if (materialStock.currentStock < validatedData.quantity) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          details: {
            available: materialStock.currentStock,
            requested: validatedData.quantity,
            materialName: materialStock.materialName,
          },
        },
        { status: 400 }
      );
    }

    // Calculate total value if unit price is provided
    const totalValue = validatedData.unitPrice
      ? validatedData.quantity * validatedData.unitPrice
      : null;

    // Prepare outflow data
    const outflowData = {
      materialId: validatedData.materialId,
      unitId: validatedData.unitId,
      projectId: validatedData.projectId,
      quantity: validatedData.quantity.toString(),
      unitPrice: validatedData.unitPrice?.toString(),
      totalValue: totalValue?.toString(),
      releaseDate: new Date(validatedData.releaseDate),
      authorizedBy: validatedData.authorizedBy,
      receivedBy: validatedData.receivedBy,
      purpose: validatedData.purpose,
      returnDate: validatedData.returnDate
        ? new Date(validatedData.returnDate)
        : null,
      supportDocument: validatedData.supportDocument,
      isReturned: false, // Default to false for new outflows
      createdBy: session.user.id,
    };

    const [newOutflow] = await db
      .insert(outflows)
      .values(outflowData)
      .returning();

    // Return the outflow with related data
    const [outflowWithDetails] = await db
      .select({
        id: outflows.id,
        materialId: outflows.materialId,
        materialName: materials.name,
        unitId: outflows.unitId,
        unitName: units.name,
        projectId: outflows.projectId,
        projectName: projects.name,
        quantity: outflows.quantity,
        unitPrice: outflows.unitPrice,
        totalValue: outflows.totalValue,
        releaseDate: outflows.releaseDate,
        authorizedBy: outflows.authorizedBy,
        receivedBy: outflows.receivedBy,
        purpose: outflows.purpose,
        supportDocument: outflows.supportDocument,
        returnDate: outflows.returnDate,
        isReturned: outflows.isReturned,
        createdAt: outflows.createdAt,
        updatedAt: outflows.updatedAt,
      })
      .from(outflows)
      .leftJoin(materials, eq(outflows.materialId, materials.id))
      .leftJoin(units, eq(outflows.unitId, units.id))
      .leftJoin(projects, eq(outflows.projectId, projects.id))
      .where(eq(outflows.id, newOutflow.id))
      .limit(1);

    return NextResponse.json(outflowWithDetails, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error creating outflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
