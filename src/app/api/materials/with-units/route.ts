import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMaterialsWithUnits } from "@/lib/db/inventory-queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const materialsWithUnits = await getMaterialsWithUnits();
    return NextResponse.json(materialsWithUnits);
  } catch (error) {
    console.error("Error fetching materials with units:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
