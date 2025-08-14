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

export const createInflowSchema = z.object({
  materialId: z.uuid("Please select a material"),
  unitId: z.uuid("Please select a unit"),
  projectId: z.uuid("Please select a project"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .transform((val) => parseFloat(val)),
  unitPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  receivedBy: z
    .string()
    .min(1, "Received by is required")
    .max(255, "Name too long"),
  supplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(255, "Name too long"),
  purpose: z.string().min(1, "Purpose is required"),
  batchNumber: z.string().max(100, "Batch number too long").optional(),
  expiryDate: z.string().optional(),
  supportDocument: z.string().optional(), // File URL will be stored here
});

export const updateInflowSchema = createInflowSchema.partial().extend({
  id: z.uuid(),
});

// Outflow validation schema
export const createOutflowSchema = z.object({
  materialId: z.uuid("Please select a material"),
  unitId: z.uuid("Please select a unit"),
  projectId: z.uuid("Please select a project"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .transform((val) => parseFloat(val)),
  unitPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  releaseDate: z.string().min(1, "Release date is required"),
  authorizedBy: z
    .string()
    .min(1, "Authorized by is required")
    .max(255, "Name too long"),
  receivedBy: z
    .string()
    .min(1, "Received by is required")
    .max(255, "Name too long"),
  purpose: z.string().min(1, "Purpose is required"),
  returnDate: z.string().optional(),
  supportDocument: z.string().optional(), // File URL will be stored here
});

export const updateOutflowSchema = createOutflowSchema.partial().extend({
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
export type CreateInflow = z.infer<typeof createInflowSchema>;
export type UpdateInflow = z.infer<typeof updateInflowSchema>;
export type CreateOutflow = z.infer<typeof createOutflowSchema>;
export type UpdateOutflow = z.infer<typeof updateOutflowSchema>;
