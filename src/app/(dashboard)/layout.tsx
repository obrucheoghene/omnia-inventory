import { requireAuth } from "@/lib/auth/server";
import UserProfile from "@/components/auth/user-profile";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Omnia Inventory
              </h1>
              <p className="text-sm text-gray-600">
                Warehouse Management System
              </p>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <DashboardNav />
          </aside>
          <main className="flex-1 min-h-[calc(100vh-140px)]">{children}</main>
        </div>
      </div>
    </div>
  );
}
