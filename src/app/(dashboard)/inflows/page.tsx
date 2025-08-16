import { requireAuth } from "@/lib/auth/server";
import InflowsTable from "@/components/tables/inflows-table";

export default async function InflowsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <InflowsTable />
    </div>
  );
}
