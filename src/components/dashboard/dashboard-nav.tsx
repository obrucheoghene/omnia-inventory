"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  canViewDashboard,
  canManageInventory,
  canCreateUser,
} from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Boxes,
  Ruler,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  checkPermission: (role: UserRole) => boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderOpen,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Boxes,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Materials",
    href: "/materials",
    icon: Package,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Units",
    href: "/units",
    icon: Ruler,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Inflows",
    href: "/inflows",
    icon: TrendingUp,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Outflows",
    href: "/outflows",
    icon: TrendingDown,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    checkPermission: (role) => canViewDashboard(role),
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    checkPermission: (role) => canCreateUser(role),
  },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role as UserRole;

  const filteredNavItems = navItems.filter((item) =>
    item.checkPermission(userRole)
  );

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Navigation</h2>
            <p className="text-xs text-gray-500">Warehouse Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.title}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Omnia v2.0</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
