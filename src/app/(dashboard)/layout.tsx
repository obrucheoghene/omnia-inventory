import { requireAuth } from "@/lib/auth/server";
import UserProfile from "@/components/auth/user-profile";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Menu, Sparkles } from "lucide-react";
import DashboardLayoutComp from "@/components/dashboard/dashboard-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <DashboardLayoutComp>{children}</DashboardLayoutComp>;
}
