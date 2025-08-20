// src/app/(dashboard)/users/page.tsx
import { requireAuth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import UsersTable from "@/components/tables/users-table";

export default async function UsersPage() {
  const user = await requireAuth();

  // Check if user is SUPER_USER, redirect if not
  if (user.role !== "SUPER_USER") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6">
      <UsersTable />
    </div>
  );
}
