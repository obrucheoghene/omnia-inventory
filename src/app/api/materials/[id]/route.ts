import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  materials,
  materialUnits,
  categories,
  units,
  inflows,
  outflows,
} from "@/lib/db/schema";
import { eq, and, sql, ne } from "drizzle-orm";
import { updateMaterialSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single material with relationships
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get material with category information
    const [material] = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        minStockLevel: materials.minStockLevel,
        isActive: materials.isActive,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        categoryName: categories.name,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(eq(materials.id, params.id))
      .limit(1);

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Get associated units
    const associatedUnits = await db
      .select({
        id: units.id,
        name: units.name,
        abbreviation: units.abbreviation,
        isPrimary: materialUnits.isPrimary,
        conversionFactor: materialUnits.conversionFactor,
      })
      .from(materialUnits)
      .innerJoin(units, eq(materialUnits.unitId, units.id))
      .where(eq(materialUnits.materialId, params.id))
      .orderBy(materialUnits.isPrimary); // Primary unit first

    const response = {
      ...material,
      units: associatedUnits,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update material
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
    const validatedData = updateMaterialSchema.parse({
      ...body,
      id: params.id,
    });

    // Check if material exists
    const [existingMaterial] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, params.id))
      .limit(1);

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const [duplicateMaterial] = await db
        .select()
        .from(materials)
        .where(
          and(
            sql`LOWER(${materials.name}) = LOWER(${validatedData.name})`,
            eq(materials.isActive, true),
            ne(materials.id, params.id) // Exclude current material from check
          )
        )
        .limit(1);

      if (duplicateMaterial) {
        return NextResponse.json(
          { error: "A material with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the material
    const materialData = {
      name: validatedData.name,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      minStockLevel: validatedData.minStockLevel?.toString(),
      updatedAt: new Date(),
    };

    const [updatedMaterial] = await db
      .update(materials)
      .set(materialData)
      .where(eq(materials.id, params.id))
      .returning();

    // Update material-unit relationships if unitIds provided
    if (validatedData.unitIds && validatedData.unitIds.length > 0) {
      // Delete existing relationships
      await db
        .delete(materialUnits)
        .where(eq(materialUnits.materialId, params.id));

      // Create new relationships
      const materialUnitData = validatedData.unitIds.map((unitId, index) => ({
        materialId: params.id,
        unitId: unitId,
        isPrimary: index === 0, // First unit is primary
      }));

      await db.insert(materialUnits).values(materialUnitData);
    }

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete material
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

    // Check if material exists and is active
    const [existingMaterial] = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, params.id), eq(materials.isActive, true)))
      .limit(1);

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    const [relatedInflows] = await db
      .select()
      .from(inflows)
      .where(eq(inflows.materialId, params.id))
      .limit(1);

    const [relatedOutflows] = await db
      .select()
      .from(outflows)
      .where(eq(outflows.materialId, params.id))
      .limit(1);

    if (relatedInflows || relatedOutflows) {
      return NextResponse.json(
        {
          error: "Cannot delete material with existing inflow/outflow records",
        },
        { status: 400 }
      );
    }

    // Delete material-unit relationships first (cleanup)
    await db
      .delete(materialUnits)
      .where(eq(materialUnits.materialId, params.id));

    // Soft delete the material
    const [deletedMaterial] = await db
      .update(materials)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Material deleted successfully",
      material: deletedMaterial,
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
