import { UserRole } from "@/types/auth";

export const PERMISSIONS = {
  // User management
  CREATE_USER: ["SUPER_USER"] as const,
  VIEW_USERS: ["SUPER_USER"] as const,
  UPDATE_USER: ["SUPER_USER"] as const,
  DELETE_USER: ["SUPER_USER"] as const,

  // Inventory management
  CREATE_INFLOW: ["SUPER_USER", "EDITOR"] as const,
  CREATE_OUTFLOW: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_INFLOW: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_OUTFLOW: ["SUPER_USER", "EDITOR"] as const,
  DELETE_INFLOW: ["SUPER_USER", "EDITOR"] as const,
  DELETE_OUTFLOW: ["SUPER_USER", "EDITOR"] as const,

  // Material management
  CREATE_MATERIAL: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_MATERIAL: ["SUPER_USER", "EDITOR"] as const,
  DELETE_MATERIAL: ["SUPER_USER", "EDITOR"] as const,

  // Project management
  CREATE_PROJECT: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_PROJECT: ["SUPER_USER", "EDITOR"] as const,
  DELETE_PROJECT: ["SUPER_USER", "EDITOR"] as const,

  // Category management
  CREATE_CATEGORY: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_CATEGORY: ["SUPER_USER", "EDITOR"] as const,
  DELETE_CATEGORY: ["SUPER_USER", "EDITOR"] as const,

  // Unit management
  CREATE_UNIT: ["SUPER_USER", "EDITOR"] as const,
  UPDATE_UNIT: ["SUPER_USER", "EDITOR"] as const,
  DELETE_UNIT: ["SUPER_USER", "EDITOR"] as const,

  // View permissions (all roles can view)
  VIEW_DASHBOARD: ["SUPER_USER", "EDITOR", "VIEWER"] as const,
  VIEW_INVENTORY: ["SUPER_USER", "EDITOR", "VIEWER"] as const,
  VIEW_REPORTS: ["SUPER_USER", "EDITOR", "VIEWER"] as const,
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(userRole);
}

export function canCreateUser(userRole: UserRole): boolean {
  return hasPermission(userRole, "CREATE_USER");
}

export function canManageInventory(userRole: UserRole): boolean {
  return hasPermission(userRole, "CREATE_INFLOW");
}

export function canViewDashboard(userRole: UserRole): boolean {
  return hasPermission(userRole, "VIEW_DASHBOARD");
}
