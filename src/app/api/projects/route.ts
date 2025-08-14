import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { createProjectSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";

// GET - List all projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(projects.name);

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new project
// POST - Create new project
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
    const validatedData = createProjectSchema.parse(body);

    // Check for duplicate project name (case-insensitive)
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(
        and(
          sql`LOWER(${projects.name}) = LOWER(${validatedData.name})`,
          eq(projects.isActive, true)
        )
      )
      .limit(1);

    if (existingProject) {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 400 }
      );
    }

    const [newProject] = await db
      .insert(projects)
      .values(validatedData)
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
