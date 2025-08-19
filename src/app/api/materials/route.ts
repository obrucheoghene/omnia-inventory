import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { materials, materialUnits } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createMaterialSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - List all materials with their associated units
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all materials with their associated unit IDs
    const materialsWithUnits = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        minStockLevel: materials.minStockLevel,
        isActive: materials.isActive,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        unitIds: sql<string[]>`
          COALESCE(
            ARRAY_AGG(${materialUnits.unitId}) FILTER (WHERE ${materialUnits.unitId} IS NOT NULL),
            ARRAY[]::uuid[]
          )
        `.as("unitIds"),
      })
      .from(materials)
      .leftJoin(materialUnits, eq(materials.id, materialUnits.materialId))
      .where(eq(materials.isActive, true))
      .groupBy(
        materials.id,
        materials.name,
        materials.description,
        materials.categoryId,
        materials.minStockLevel,
        materials.isActive,
        materials.createdAt,
        materials.updatedAt
      )
      .orderBy(materials.name);

    return NextResponse.json(materialsWithUnits);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = createMaterialSchema.parse(body);

    // Check for duplicate material name (case-insensitive)
    const [existingMaterial] = await db
      .select()
      .from(materials)
      .where(
        and(
          sql`LOWER(${materials.name}) = LOWER(${validatedData.name})`,
          eq(materials.isActive, true)
        )
      )
      .limit(1);

    if (existingMaterial) {
      return NextResponse.json(
        { error: "A material with this name already exists" },
        { status: 400 }
      );
    }

    // Create the material (exclude unitIds from materials insert)
    const materialData = {
      name: validatedData.name,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      minStockLevel: validatedData.minStockLevel?.toString() || "0", // Convert to string
    };

    const [newMaterial] = await db
      .insert(materials)
      .values(materialData)
      .returning();

    // Create material-unit relationships
    if (validatedData.unitIds && validatedData.unitIds.length > 0) {
      const materialUnitData = validatedData.unitIds.map((unitId, index) => ({
        materialId: newMaterial.id,
        unitId: unitId,
        isPrimary: index === 0, // First unit is primary
      }));

      await db.insert(materialUnits).values(materialUnitData);
    }

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message }, // Fixed: use .errors not .message
        { status: 400 }
      );
    }

    console.error("Error creating material:", error); // Fixed: changed from "unit" to "material"
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
