import { db } from "./index";
import {
  materials,
  inflows,
  outflows,
  categories,
  units,
  projects,
} from "./schema";
import { eq, desc, and, sum, sql } from "drizzle-orm";

// Get current stock levels for all materials
export async function getCurrentStockLevels() {
  const stockQuery = db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      categoryName: categories.name,
      totalInflow: sql<number>`COALESCE(SUM(${inflows.quantity}), 0)`,
      totalOutflow: sql<number>`COALESCE(SUM(${outflows.quantity}), 0)`,
      currentStock: sql<number>`COALESCE(SUM(${inflows.quantity}), 0) - COALESCE(SUM(${outflows.quantity}), 0)`,
    })
    .from(materials)
    .leftJoin(categories, eq(materials.categoryId, categories.id))
    .leftJoin(inflows, eq(materials.id, inflows.materialId))
    .leftJoin(outflows, eq(materials.id, outflows.materialId))
    .groupBy(materials.id, materials.name, categories.name);

  return await stockQuery;
}

// Get stock level for a specific material
export async function getMaterialStock(materialId: string) {
  const [result] = await db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      totalInflow: sql<number>`COALESCE(SUM(${inflows.quantity}), 0)`,
      totalOutflow: sql<number>`COALESCE(SUM(${outflows.quantity}), 0)`,
      currentStock: sql<number>`COALESCE(SUM(${inflows.quantity}), 0) - COALESCE(SUM(${outflows.quantity}), 0)`,
    })
    .from(materials)
    .leftJoin(inflows, eq(materials.id, inflows.materialId))
    .leftJoin(outflows, eq(materials.id, outflows.materialId))
    .where(eq(materials.id, materialId))
    .groupBy(materials.id, materials.name);

  return result;
}

// Get recent activities (inflows and outflows)
export async function getRecentActivities(limit: number = 10) {
  const recentInflows = db
    .select({
      id: inflows.id,
      type: sql<string>`'inflow'`,
      materialName: materials.name,
      quantity: inflows.quantity,
      projectName: projects.name,
      date: inflows.deliveryDate,
      createdAt: inflows.createdAt,
    })
    .from(inflows)
    .leftJoin(materials, eq(inflows.materialId, materials.id))
    .leftJoin(projects, eq(inflows.projectId, projects.id));

  const recentOutflows = db
    .select({
      id: outflows.id,
      type: sql<string>`'outflow'`,
      materialName: materials.name,
      quantity: outflows.quantity,
      projectName: projects.name,
      date: outflows.releaseDate,
      createdAt: outflows.createdAt,
    })
    .from(outflows)
    .leftJoin(materials, eq(outflows.materialId, materials.id))
    .leftJoin(projects, eq(outflows.projectId, projects.id));

  // Union and order by createdAt
  const activities = await db
    .select()
    .from(recentInflows.unionAll(recentOutflows).as("activities"))
    .orderBy(desc(sql`created_at`))
    .limit(limit);

  return activities;
}
