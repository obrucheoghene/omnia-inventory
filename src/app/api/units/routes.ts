import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createUnitSchema } from "@/lib/validations";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import { z } from "zod";

// GET - List all units
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUnits = await db
      .select()
      .from(units)
      .where(eq(units.isActive, true))
      .orderBy(units.name);

    return NextResponse.json(allUnits);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new unit
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
    const validatedData = createUnitSchema.parse(body);

    // Check for duplicate unit name (case-insensitive)
    const [existingUnit] = await db
      .select()
      .from(units)
      .where(
        and(
          sql`LOWER(${units.name}) = LOWER(${validatedData.name})`,
          eq(units.isActive, true)
        )
      )
      .limit(1);

    if (existingUnit) {
      return NextResponse.json(
        { error: "A unit with this name already exists" },
        { status: 400 }
      );
    }

    // Also check for duplicate abbreviation if provided
    if (validatedData.abbreviation) {
      const [existingAbbreviation] = await db
        .select()
        .from(units)
        .where(
          and(
            sql`LOWER(${units.abbreviation}) = LOWER(${validatedData.abbreviation})`,
            eq(units.isActive, true)
          )
        )
        .limit(1);

      if (existingAbbreviation) {
        return NextResponse.json(
          { error: "A unit with this abbreviation already exists" },
          { status: 400 }
        );
      }
    }

    const [newUnit] = await db.insert(units).values(validatedData).returning();

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
