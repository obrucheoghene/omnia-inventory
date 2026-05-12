import { requireAuth } from "@/lib/auth/server";
import CategoriesTable from "@/components/tables/categories-table";

export default async function CategoriesPage() {
  await requireAuth();

  return <CategoriesTable />;
}
