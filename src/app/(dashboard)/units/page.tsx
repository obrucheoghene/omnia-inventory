import { requireAuth } from "@/lib/auth/server";
import UnitsTable from "@/components/tables/units-table";

export default async function UnitsPage() {
  await requireAuth();

  return <UnitsTable />;
}
