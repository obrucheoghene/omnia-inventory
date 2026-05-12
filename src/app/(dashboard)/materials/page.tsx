import { requireAuth } from "@/lib/auth/server";
import MaterialsTable from "@/components/tables/materials-table";

export default async function MaterialsPage() {
  await requireAuth();
  return <MaterialsTable />;
}
