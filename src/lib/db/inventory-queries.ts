/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./index";
import {
  materials,
  inflows,
  outflows,
  categories,
  units,
  projects,
  materialUnits,
  users,
} from "./schema";
import { eq, desc, and, sum, sql, gte, lte } from "drizzle-orm";

// Get materials with their available units (for form dropdowns)
export async function getMaterialsWithUnits() {
  const result = await db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      categoryId: materials.categoryId,
      categoryName: categories.name,
      unitId: units.id,
      unitName: units.name,
      unitAbbreviation: units.abbreviation,
      isPrimary: materialUnits.isPrimary,
    })
    .from(materials)
    .innerJoin(categories, eq(materials.categoryId, categories.id))
    .innerJoin(materialUnits, eq(materials.id, materialUnits.materialId))
    .innerJoin(units, eq(materialUnits.unitId, units.id))
    .where(eq(materials.isActive, true))
    .orderBy(materials.name, materialUnits.isPrimary);

  // Group by material
  const groupedMaterials = result.reduce((acc, row) => {
    const materialKey = row.materialId;
    if (!acc[materialKey]) {
      acc[materialKey] = {
        id: row.materialId,
        name: row.materialName,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        units: [],
      };
    }
    acc[materialKey].units.push({
      id: row.unitId,
      name: row.unitName,
      abbreviation: row.unitAbbreviation,
      isPrimary: row.isPrimary,
    });
    return acc;
  }, {} as Record<string, any>);

  return Object.values(groupedMaterials);
}

// Get current stock levels for all materials
export async function getCurrentStockLevels() {
  const stockQuery = await db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      categoryName: categories.name,
      totalInflow: sql<number>`COALESCE(SUM(CASE WHEN ${inflows.id} IS NOT NULL THEN ${inflows.quantity} ELSE 0 END), 0)`,
      totalOutflow: sql<number>`COALESCE(SUM(CASE WHEN ${outflows.id} IS NOT NULL THEN ${outflows.quantity} ELSE 0 END), 0)`,
      currentStock: sql<number>`COALESCE(SUM(CASE WHEN ${inflows.id} IS NOT NULL THEN ${inflows.quantity} ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${outflows.id} IS NOT NULL THEN ${outflows.quantity} ELSE 0 END), 0)`,
      minStockLevel: materials.minStockLevel,
    })
    .from(materials)
    .leftJoin(categories, eq(materials.categoryId, categories.id))
    .leftJoin(inflows, eq(materials.id, inflows.materialId))
    .leftJoin(outflows, eq(materials.id, outflows.materialId))
    .where(eq(materials.isActive, true))
    .groupBy(
      materials.id,
      materials.name,
      categories.name,
      materials.minStockLevel
    );

  return stockQuery;
}

// Get stock level for a specific material
export async function getMaterialStock(materialId: string, unitId?: string) {
  const query = db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      totalInflow: sql<number>`COALESCE(SUM(CASE WHEN ${inflows.id} IS NOT NULL THEN ${inflows.quantity} ELSE 0 END), 0)`,
      totalOutflow: sql<number>`COALESCE(SUM(CASE WHEN ${outflows.id} IS NOT NULL THEN ${outflows.quantity} ELSE 0 END), 0)`,
      currentStock: sql<number>`COALESCE(SUM(CASE WHEN ${inflows.id} IS NOT NULL THEN ${inflows.quantity} ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${outflows.id} IS NOT NULL THEN ${outflows.quantity} ELSE 0 END), 0)`,
    })
    .from(materials)
    .leftJoin(
      inflows,
      and(
        eq(materials.id, inflows.materialId),
        unitId ? eq(inflows.unitId, unitId) : undefined
      )
    )
    .leftJoin(
      outflows,
      and(
        eq(materials.id, outflows.materialId),
        unitId ? eq(outflows.unitId, unitId) : undefined
      )
    )
    .where(eq(materials.id, materialId))
    .groupBy(materials.id, materials.name);

  const [result] = await query;
  return result;
}

// Get recent activities (inflows and outflows)
export async function getRecentActivities(limit: number = 10) {
  const recentInflows = await db
    .select({
      id: inflows.id,
      type: sql<string>`'inflow'`,
      materialName: materials.name,
      quantity: inflows.quantity,
      unitName: units.name,
      projectName: projects.name,
      date: inflows.deliveryDate,
      person: inflows.receivedBy,
      createdAt: inflows.createdAt,
    })
    .from(inflows)
    .leftJoin(materials, eq(inflows.materialId, materials.id))
    .leftJoin(units, eq(inflows.unitId, units.id))
    .leftJoin(projects, eq(inflows.projectId, projects.id))
    .orderBy(desc(inflows.createdAt))
    .limit(limit);

  const recentOutflows = await db
    .select({
      id: outflows.id,
      type: sql<string>`'outflow'`,
      materialName: materials.name,
      quantity: outflows.quantity,
      unitName: units.name,
      projectName: projects.name,
      date: outflows.releaseDate,
      person: outflows.authorizedBy,
      createdAt: outflows.createdAt,
    })
    .from(outflows)
    .leftJoin(materials, eq(outflows.materialId, materials.id))
    .leftJoin(units, eq(outflows.unitId, units.id))
    .leftJoin(projects, eq(outflows.projectId, projects.id))
    .orderBy(desc(outflows.createdAt))
    .limit(limit);

  // Combine and sort by creation date
  const allActivities = [...recentInflows, ...recentOutflows]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);

  return allActivities;
}

// Get inventory movements for a date range
export async function getInventoryMovements(
  startDate: Date,
  endDate: Date,
  materialId?: string,
  projectId?: string
) {
  const inflowsQuery = db
    .select({
      id: inflows.id,
      type: sql<string>`'inflow'`,
      materialId: inflows.materialId,
      materialName: materials.name,
      categoryName: categories.name,
      quantity: inflows.quantity,
      unitName: units.name,
      projectName: projects.name,
      date: inflows.deliveryDate,
      person: inflows.receivedBy,
      purpose: inflows.purpose,
      createdAt: inflows.createdAt,
    })
    .from(inflows)
    .leftJoin(materials, eq(inflows.materialId, materials.id))
    .leftJoin(categories, eq(materials.categoryId, categories.id))
    .leftJoin(units, eq(inflows.unitId, units.id))
    .leftJoin(projects, eq(inflows.projectId, projects.id))
    .where(
      and(
        gte(inflows.deliveryDate, startDate),
        lte(inflows.deliveryDate, endDate),
        materialId ? eq(inflows.materialId, materialId) : undefined,
        projectId ? eq(inflows.projectId, projectId) : undefined
      )
    );

  const outflowsQuery = db
    .select({
      id: outflows.id,
      type: sql<string>`'outflow'`,
      materialId: outflows.materialId,
      materialName: materials.name,
      categoryName: categories.name,
      quantity: outflows.quantity,
      unitName: units.name,
      projectName: projects.name,
      date: outflows.releaseDate,
      person: outflows.authorizedBy,
      purpose: outflows.purpose,
      createdAt: outflows.createdAt,
    })
    .from(outflows)
    .leftJoin(materials, eq(outflows.materialId, materials.id))
    .leftJoin(categories, eq(materials.categoryId, categories.id))
    .leftJoin(units, eq(outflows.unitId, units.id))
    .leftJoin(projects, eq(outflows.projectId, projects.id))
    .where(
      and(
        gte(outflows.releaseDate, startDate),
        lte(outflows.releaseDate, endDate),
        materialId ? eq(outflows.materialId, materialId) : undefined,
        projectId ? eq(outflows.projectId, projectId) : undefined
      )
    );

  const [inflowResults, outflowResults] = await Promise.all([
    inflowsQuery,
    outflowsQuery,
  ]);

  return [...inflowResults, ...outflowResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
