import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getCurrentStockLevels,
  getRecentActivities,
} from "@/lib/db/inventory-queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [stockLevels, recentActivities] = await Promise.all([
      getCurrentStockLevels(),
      getRecentActivities(10),
    ]);

    // Calculate summary statistics
    const totalMaterials = stockLevels.length;
    const lowStockMaterials = stockLevels.filter(
      (item) =>
        parseFloat(item.minStockLevel || "0") > 0 &&
        item.currentStock <= parseFloat(item.minStockLevel || "0")
    ).length;
    const outOfStockMaterials = stockLevels.filter(
      (item) => item.currentStock <= 0
    ).length;

    const dashboardData = {
      summary: {
        totalMaterials,
        lowStockMaterials,
        outOfStockMaterials,
        totalStockValue: stockLevels.reduce(
          (acc, item) => acc + item.currentStock * 0,
          0
        ), // TODO: Add pricing calculation
      },
      stockLevels: stockLevels.slice(0, 20), // Top 20 for dashboard
      recentActivities,
      lowStockAlerts: stockLevels
        .filter(
          (item) =>
            parseFloat(item.minStockLevel || "0") > 0 &&
            item.currentStock <= parseFloat(item.minStockLevel || "0")
        )
        .slice(0, 5),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
