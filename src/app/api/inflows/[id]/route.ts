import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { inflows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateInflowSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single inflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [inflow] = await db
      .select()
      .from(inflows)
      .where(eq(inflows.id, id))
      .limit(1);

    if (!inflow) {
      return NextResponse.json({ error: "Inflow not found" }, { status: 404 });
    }

    return NextResponse.json(inflow);
  } catch (error) {
    console.error("Error fetching inflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update inflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateInflowSchema.parse({ ...body, id: id });

    // Check if inflow exists
    const [existingInflow] = await db
      .select()
      .from(inflows)
      .where(eq(inflows.id, id))
      .limit(1);

    if (!existingInflow) {
      return NextResponse.json({ error: "Inflow not found" }, { status: 404 });
    }

    // Calculate total value if unit price is provided
    const totalValue =
      validatedData.unitPrice && validatedData.quantity
        ? validatedData.quantity * validatedData.unitPrice
        : null;

    // Prepare update data
    const updateData = {
      materialId: validatedData.materialId,
      unitId: validatedData.unitId,
      projectId: validatedData.projectId,
      quantity: validatedData.quantity?.toString(),
      unitPrice: validatedData.unitPrice?.toString(),
      totalValue: totalValue?.toString(),
      deliveryDate: validatedData.deliveryDate
        ? new Date(validatedData.deliveryDate)
        : undefined,
      receivedBy: validatedData.receivedBy,
      supplierName: validatedData.supplierName,
      purpose: validatedData.purpose,
      batchNumber: validatedData.batchNumber,
      expiryDate: validatedData.expiryDate
        ? new Date(validatedData.expiryDate)
        : undefined,
      supportDocument: validatedData.supportDocument,
      updatedAt: new Date(),
    };

    const [updatedInflow] = await db
      .update(inflows)
      .set(updateData)
      .where(eq(inflows.id, id))
      .returning();

    return NextResponse.json(updatedInflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating inflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete inflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [existingInflow] = await db
      .select()
      .from(inflows)
      .where(eq(inflows.id, id))
      .limit(1);

    if (!existingInflow) {
      return NextResponse.json({ error: "Inflow not found" }, { status: 404 });
    }

    await db.delete(inflows).where(eq(inflows.id, id));

    return NextResponse.json({ message: "Inflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting inflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
