import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { outflows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateOutflowSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single outflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [outflow] = await db
      .select()
      .from(outflows)
      .where(eq(outflows.id, params.id))
      .limit(1);

    if (!outflow) {
      return NextResponse.json({ error: "Outflow not found" }, { status: 404 });
    }

    return NextResponse.json(outflow);
  } catch (error) {
    console.error("Error fetching outflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update outflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateOutflowSchema.parse({ ...body, id: params.id });

    const [existingOutflow] = await db
      .select()
      .from(outflows)
      .where(eq(outflows.id, params.id))
      .limit(1);

    if (!existingOutflow) {
      return NextResponse.json({ error: "Outflow not found" }, { status: 404 });
    }

    const totalValue =
      validatedData.unitPrice && validatedData.quantity
        ? validatedData.quantity * validatedData.unitPrice
        : null;

    const updateData = {
      materialId: validatedData.materialId,
      unitId: validatedData.unitId,
      projectId: validatedData.projectId,
      quantity: validatedData.quantity?.toString(),
      unitPrice: validatedData.unitPrice?.toString(),
      totalValue: totalValue?.toString(),
      releaseDate: validatedData.releaseDate
        ? new Date(validatedData.releaseDate)
        : undefined,
      authorizedBy: validatedData.authorizedBy,
      receivedBy: validatedData.receivedBy,
      purpose: validatedData.purpose,
      returnDate: validatedData.returnDate
        ? new Date(validatedData.returnDate)
        : undefined,
      supportDocument: validatedData.supportDocument,
      updatedAt: new Date(),
    };

    const [updatedOutflow] = await db
      .update(outflows)
      .set(updateData)
      .where(eq(outflows.id, params.id))
      .returning();

    return NextResponse.json(updatedOutflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating outflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete outflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [existingOutflow] = await db
      .select()
      .from(outflows)
      .where(eq(outflows.id, params.id))
      .limit(1);

    if (!existingOutflow) {
      return NextResponse.json({ error: "Outflow not found" }, { status: 404 });
    }

    await db.delete(outflows).where(eq(outflows.id, params.id));

    return NextResponse.json({ message: "Outflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting outflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
