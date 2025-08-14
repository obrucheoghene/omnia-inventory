import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { units, materialUnits } from "@/lib/db/schema";
import { eq, and, sql, ne } from "drizzle-orm";
import { updateUnitSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, params.id))
      .limit(1);

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions using helper function
    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateUnitSchema.parse({ ...body, id: params.id });

    // Check if unit exists
    const [existingUnit] = await db
      .select()
      .from(units)
      .where(eq(units.id, params.id))
      .limit(1);

    if (!existingUnit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Check for duplicate name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingUnit.name) {
      const [duplicateUnit] = await db
        .select()
        .from(units)
        .where(
          and(
            sql`LOWER(${units.name}) = LOWER(${validatedData.name})`,
            eq(units.isActive, true),
            ne(units.id, params.id) // Exclude current unit from check
          )
        )
        .limit(1);

      if (duplicateUnit) {
        return NextResponse.json(
          { error: "A unit with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate abbreviation (if abbreviation is being updated)
    if (
      validatedData.abbreviation &&
      validatedData.abbreviation !== existingUnit.abbreviation
    ) {
      const [duplicateAbbreviation] = await db
        .select()
        .from(units)
        .where(
          and(
            sql`LOWER(${units.abbreviation}) = LOWER(${validatedData.abbreviation})`,
            eq(units.isActive, true),
            ne(units.id, params.id) // Exclude current unit from check
          )
        )
        .limit(1);

      if (duplicateAbbreviation) {
        return NextResponse.json(
          { error: "A unit with this abbreviation already exists" },
          { status: 400 }
        );
      }
    }

    const [updatedUnit] = await db
      .update(units)
      .set({
        name: validatedData.name,
        abbreviation: validatedData.abbreviation,
        description: validatedData.description,
        updatedAt: new Date(),
      })
      .where(eq(units.id, params.id))
      .returning();

    return NextResponse.json(updatedUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions using helper function
    if (!canManageInventory(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if unit exists and is active
    const [existingUnit] = await db
      .select()
      .from(units)
      .where(and(eq(units.id, params.id), eq(units.isActive, true)))
      .limit(1);

    if (!existingUnit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Check for related material-unit relationships before deletion
    const [relatedMaterialUnits] = await db
      .select()
      .from(materialUnits)
      .where(eq(materialUnits.unitId, params.id))
      .limit(1);

    if (relatedMaterialUnits) {
      return NextResponse.json(
        {
          error:
            "Cannot delete unit that is being used by materials. Please remove unit from materials first.",
        },
        { status: 400 }
      );
    }

    const [deletedUnit] = await db
      .update(units)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(units.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Unit deleted successfully",
      unit: deletedUnit,
    });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
