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
    <nav className="space-y-2">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
