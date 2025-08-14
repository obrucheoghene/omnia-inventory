import { requireAuth } from "@/lib/auth/server";
import ProjectsTable from "@/components/tables/projects-table";

export default async function ProjectsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <ProjectsTable />
    </div>
  );
}
