import { requireAuth } from "@/lib/auth/server";
import InventoryOverview from "@/components/dashboard/inventory-overview";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}!</p>
      </div>

      <InventoryOverview />
    </div>
  );
}
