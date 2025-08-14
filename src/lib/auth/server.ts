import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/auth";
import { hasPermission, Permission } from "./permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect("/auth/signin");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!hasPermission(user.role as UserRole, permission)) {
    redirect("/auth/signin");
  }
  return user;
}
