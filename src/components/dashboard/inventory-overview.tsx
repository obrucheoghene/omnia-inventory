// This is the content to replace the empty inventory-overview.tsx file

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
} from "lucide-react";

// Import our dashboard components
import DashboardSummaryCards from "@/components/dashboard/dashboard-summary-cards";
import StockLevelsTable from "@/components/dashboard/stock-levels-table";
import RecentActivities from "@/components/dashboard/recent-activities";
import LowStockAlerts from "@/components/dashboard/low-stock-alerts";

// Import the dashboard hook
import { useDashboard } from "@/hooks/use-dashboard";

// Import inflow form if user can create inflows
import InflowForm from "@/components/forms/inflow-form";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";

export default function InventoryOverview() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();
  const [showInflowForm, setShowInflowForm] = useState(false);

  const canEdit = canManageInventory(session?.user?.role as UserRole);

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateInflow = () => {
    setShowInflowForm(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-[150px]" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error.message}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No dashboard data available. Please check your inventory setup.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inventory Overview
          </h2>
          <p className="text-muted-foreground">
            Real-time inventory tracking and stock management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <DashboardSummaryCards summary={dashboardData.summary} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Stock Levels Table */}
        <div className="lg:col-span-2">
          <StockLevelsTable stockLevels={dashboardData.stockLevels} />
        </div>

        {/* Right Column - Alerts and Activities */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlerts
            lowStockItems={dashboardData.lowStockAlerts}
            onCreateInflow={canEdit ? handleCreateInflow : undefined}
          />

          {/* Recent Activities */}
          <RecentActivities activities={dashboardData.recentActivities} />
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inflows (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                dashboardData.recentActivities.filter(
                  (activity) => activity.type === "inflow"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Materials received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outflows (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                dashboardData.recentActivities.filter(
                  (activity) => activity.type === "outflow"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Materials distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                new Set(
                  dashboardData.recentActivities.map((a) => a.projectName)
                ).size
              }
            </div>
            <p className="text-xs text-muted-foreground">
              With recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inflow Form Modal */}
      {canEdit && (
        <InflowForm
          open={showInflowForm}
          onOpenChange={setShowInflowForm}
          mode="create"
        />
      )}
    </div>
  );
}
