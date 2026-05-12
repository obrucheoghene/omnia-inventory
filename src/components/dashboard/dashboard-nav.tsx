"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { canViewDashboard, canCreateUser } from "@/lib/auth/permissions";
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
  Sparkles,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  checkPermission: (role: UserRole) => boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        checkPermission: (role) => canViewDashboard(role),
      },
    ],
  },
  {
    label: "Inventory",
    items: [
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
    ],
  },
  {
    label: "Operations",
    items: [
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
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        checkPermission: (role) => canViewDashboard(role),
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        checkPermission: (role) => canCreateUser(role),
      },
    ],
  },
];

export default function DashboardNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role as UserRole;

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Omnia Inventory</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Warehouse Management</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter((item) =>
            item.checkPermission(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 border-l-2",
                        isActive
                          ? "bg-primary/8 text-primary border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{session?.user?.name ?? "User"}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
