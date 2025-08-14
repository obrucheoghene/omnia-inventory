import { requireAuth } from "@/lib/auth/server";
import CategoriesTable from "@/components/tables/categories-table";

export default async function CategoriesPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <CategoriesTable />
    </div>
  );
}
