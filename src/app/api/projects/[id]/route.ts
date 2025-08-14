import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { inflows, outflows, projects } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validations";
import { canManageInventory, hasPermission } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - Get single project
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
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update project
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
    const validatedData = updateProjectSchema.parse({ ...body, id: params.id });

    // Check if project exists
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check for duplicate name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingProject.name) {
      const [duplicateProject] = await db
        .select()
        .from(projects)
        .where(
          and(
            sql`LOWER(${projects.name}) = LOWER(${validatedData.name})`,
            eq(projects.isActive, true),
            ne(projects.id, params.id) // Exclude current project from check
          )
        )
        .limit(1);

      if (duplicateProject) {
        return NextResponse.json(
          { error: "A project with this name already exists" },
          { status: 400 }
        );
      }
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))
      .returning();

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete project
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

    // Check if project exists and is active
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.isActive, true)))
      .limit(1);

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Prevent Delete if project have inflow/outflow records
    const [relatedInflows] = await db
      .select()
      .from(inflows)
      .where(eq(inflows.projectId, params.id))
      .limit(1);

    const [relatedOutflows] = await db
      .select()
      .from(outflows)
      .where(eq(outflows.projectId, params.id))
      .limit(1);

    if (relatedInflows || relatedOutflows) {
      return NextResponse.json(
        { error: "Cannot delete project with existing inflow/outflow records" },
        { status: 400 }
      );
    }

    const [deletedProject] = await db
      .update(projects)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Project deleted successfully",
      project: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
