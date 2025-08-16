import { requireAuth } from "@/lib/auth/server";
import OutflowsTable from "@/components/tables/outflows-table";

export default async function OutflowsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <OutflowsTable />
    </div>
  );
}
