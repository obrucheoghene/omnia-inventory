import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { categories, materials } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { updateCategorySchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [project] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update category
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
    const validatedData = updateCategorySchema.parse({
      ...body,
      id: params.id,
    });

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const [duplicateCategory] = await db
        .select()
        .from(categories)
        .where(
          and(
            sql`LOWER(${categories.name}) = LOWER(${validatedData.name})`,
            eq(categories.isActive, true),
            ne(categories.id, params.id) // Exclude current category from check
          )
        )
        .limit(1);

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, params.id))
      .returning();

    return NextResponse.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete category
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

    // Check if category exists and is active
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, params.id), eq(categories.isActive, true)))
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for related materials before deletion
    const [relatedMaterials] = await db
      .select()
      .from(materials)
      .where(
        and(eq(materials.categoryId, params.id), eq(materials.isActive, true))
      )
      .limit(1);

    if (relatedMaterials) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category with existing materials. Please move or delete materials first.",
        },
        { status: 400 }
      );
    }

    const [deletedCategory] = await db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Category deleted successfully",
      category: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
