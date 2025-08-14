import { z } from "zod";

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Name too long"),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.uuid(),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Name too long"),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.uuid(),
});

// Unit validation schemas
export const createUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(100, "Name too long"),
  abbreviation: z.string().max(20, "Abbreviation too long").optional(),
  description: z.string().optional(),
});

export const updateUnitSchema = createUnitSchema.partial().extend({
  id: z.uuid(),
});

// Material validation schemas
export const createMaterialSchema = z.object({
  name: z
    .string()
    .min(1, "Material name is required")
    .max(255, "Name too long"),
  description: z.string().optional(),
  categoryId: z.uuid("Please select a category"),
  minStockLevel: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  unitIds: z.array(z.uuid()).min(1, "Please select at least one unit"),
});

export const updateMaterialSchema = createMaterialSchema.partial().extend({
  id: z.uuid(),
});

// Infer types
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CreateUnit = z.infer<typeof createUnitSchema>;
export type UpdateUnit = z.infer<typeof updateUnitSchema>;
export type CreateMaterial = z.infer<typeof createMaterialSchema>;
export type UpdateMaterial = z.infer<typeof updateMaterialSchema>;
