import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "SUPER_USER",
  "EDITOR",
  "VIEWER",
]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("VIEWER"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Projects Table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Units Table
export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 20 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Materials Table
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  minStockLevel: decimal("min_stock_level", {
    precision: 12,
    scale: 2,
  }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Materials-Units Junction Table (Many-to-Many)
export const materialUnits = pgTable("material_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false), // Primary unit for the material
  conversionFactor: decimal("conversion_factor", {
    precision: 12,
    scale: 4,
  }).default("1"), // For unit conversions
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Inflows Table
export const inflows = pgTable("inflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
  receivedBy: varchar("received_by", { length: 255 }).notNull(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  purpose: text("purpose").notNull(),
  supportDocument: varchar("support_document", { length: 500 }), // File path/URL
  batchNumber: varchar("batch_number", { length: 100 }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Outflows Table
export const outflows = pgTable("outflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  releaseDate: timestamp("release_date", { withTimezone: true }).notNull(),
  authorizedBy: varchar("authorized_by", { length: 255 }).notNull(),
  receivedBy: varchar("received_by", { length: 255 }).notNull(),
  purpose: text("purpose").notNull(),
  supportDocument: varchar("support_document", { length: 500 }), // File path/URL
  returnDate: timestamp("return_date", { withTimezone: true }), // For returnable items
  isReturned: boolean("is_returned").notNull().default(false),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Audit Log Table (for tracking changes)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id").notNull(),
  action: varchar("action", { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  oldValues: text("old_values"), // JSON string
  newValues: text("new_values"), // JSON string
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Define Relationships
export const usersRelations = relations(users, ({ many }) => ({
  inflows: many(inflows),
  outflows: many(outflows),
  auditLogs: many(auditLogs),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  inflows: many(inflows),
  outflows: many(outflows),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  inflows: many(inflows),
  outflows: many(outflows),
  materialUnits: many(materialUnits),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  inflows: many(inflows),
  outflows: many(outflows),
  materialUnits: many(materialUnits),
}));

export const materialUnitsRelations = relations(materialUnits, ({ one }) => ({
  material: one(materials, {
    fields: [materialUnits.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [materialUnits.unitId],
    references: [units.id],
  }),
}));

export const inflowsRelations = relations(inflows, ({ one }) => ({
  material: one(materials, {
    fields: [inflows.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [inflows.unitId],
    references: [units.id],
  }),
  project: one(projects, {
    fields: [inflows.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [inflows.createdBy],
    references: [users.id],
  }),
}));

export const outflowsRelations = relations(outflows, ({ one }) => ({
  material: one(materials, {
    fields: [outflows.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [outflows.unitId],
    references: [units.id],
  }),
  project: one(projects, {
    fields: [outflows.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [outflows.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  changedByUser: one(users, {
    fields: [auditLogs.changedBy],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

export type MaterialUnit = typeof materialUnits.$inferSelect;
export type NewMaterialUnit = typeof materialUnits.$inferInsert;

export type Inflow = typeof inflows.$inferSelect;
export type NewInflow = typeof inflows.$inferInsert;

export type Outflow = typeof outflows.$inferSelect;
export type NewOutflow = typeof outflows.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
