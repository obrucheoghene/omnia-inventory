import { requireAuth } from "@/lib/auth/server";
import EnhancedDashboardClient from "@/components/dashboard/enhanced-dashboard-client";

export default async function DashboardPage() {
  const user = await requireAuth();

  // You can pass any server-side data here if needed
  return <EnhancedDashboardClient />;
}
