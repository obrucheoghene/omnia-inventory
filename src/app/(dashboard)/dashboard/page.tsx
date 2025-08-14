import { requireAuth } from "@/lib/auth/server";
import UserProfile from "@/components/auth/user-profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <UserProfile />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.name}</div>
            <p className="text-xs text-muted-foreground">Role: {user.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Username</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">@{user.username}</div>
            <p className="text-xs text-muted-foreground">
              User ID: {user.id.slice(0, 8)}...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
