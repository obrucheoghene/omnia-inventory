import { requireAuth } from "@/lib/auth/server";
import UnitsTable from "@/components/tables/units-table";

export default async function UnitsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <UnitsTable />
    </div>
  );
}
