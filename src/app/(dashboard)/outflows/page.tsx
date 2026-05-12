import { requireAuth } from "@/lib/auth/server";
import OutflowsTable from "@/components/tables/enhanced-outflows-table";

export default async function OutflowsPage() {
  await requireAuth();

  return <OutflowsTable />;
}
