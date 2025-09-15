"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Settings,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// Import your existing components
import InventoryOverview from "@/components/dashboard/enhanced-inventory-overview";

// Import the new Phase 8 components we created
// Note: You'll need to create these files in your components directory
// import InventoryCharts from "@/components/dashboard/inventory-charts";
// import DashboardAnalytics from "@/components/dashboard/dashboard-analytics";

// Import enhanced loading and error components
// import {
//   DashboardSkeleton,
//   LoadingCard,
//   FadeInLoader
// } from "@/components/ui/loading-skeletons";
// import ErrorBoundary from "@/components/ui/error-boundary";
// import { NotificationBell } from "@/components/ui/notification-system";

// Import your existing hooks
import { useDashboard } from "@/hooks/use-dashboard";

// Temporary loading and animation components (simplified versions)
function FadeInLoader({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-in fade-in duration-300"
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotificationBell() {
  return (
    <Button variant="ghost" size="sm">
      <div className="relative">
        {/* Bell icon placeholder */}
        <div className="w-5 h-5 bg-muted rounded animate-pulse" />
      </div>
    </Button>
  );
}

export default function EnhancedDashboardClient() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Enhanced Header */}
      <FadeInLoader>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}! {`Here's`} your inventory
              overview.
            </p>
          </div>

          {/* Dashboard Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </FadeInLoader>

      {/* Enhanced Dashboard with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <FadeInLoader delay={100}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visual Charts
            </TabsTrigger>
          </TabsList>
        </FadeInLoader>

        {/* Overview Tab - Your existing inventory overview */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <FadeInLoader delay={200}>
              <InventoryOverview />
            </FadeInLoader>
          )}
        </TabsContent>

        {/* Analytics Tab - New advanced analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <FadeInLoader delay={200}>
              <DashboardAnalyticsSection dashboardData={dashboardData} />
            </FadeInLoader>
          )}
        </TabsContent>

        {/* Charts Tab - New visual charts */}
        <TabsContent value="charts" className="space-y-6">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <FadeInLoader delay={200}>
              <InventoryChartsSection dashboardData={dashboardData} />
            </FadeInLoader>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Analytics section component
function DashboardAnalyticsSection({ dashboardData }: { dashboardData: any }) {
  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No dashboard data available for analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights into your inventory performance and trends
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.recentActivities?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Recent activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.summary
                ? (
                    ((dashboardData.summary.totalMaterials -
                      dashboardData.summary.outOfStockMaterials) /
                      Math.max(dashboardData.summary.totalMaterials, 1)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Materials available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.stockLevels
                ? new Set(
                    dashboardData.stockLevels.map((s: any) => s.categoryName)
                  ).size
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.summary?.lowStockMaterials || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* 
        Here you would integrate the DashboardAnalytics component:
        <DashboardAnalytics dashboardData={dashboardData} />
      */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            🚀 Advanced analytics components will be rendered here when you
            integrate the DashboardAnalytics component. This would show velocity
            metrics, project utilization, material turnover, and weekly
            patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Charts section component
function InventoryChartsSection({ dashboardData }: { dashboardData: any }) {
  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No dashboard data available for charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visual Charts</h2>
          <p className="text-muted-foreground">
            Visual representations of your inventory data and trends
          </p>
        </div>
      </div>

      {/* Stock Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.stockLevels &&
            dashboardData.stockLevels.length > 0 ? (
              <div className="space-y-4">
                {/* Simple category breakdown */}
                {Object.entries(
                  dashboardData.stockLevels.reduce((acc: any, item: any) => {
                    const category = item.categoryName || "Uncategorized";
                    acc[category] = (acc[category] || 0) + item.currentStock;
                    return acc;
                  }, {})
                )
                  .slice(0, 5)
                  .map(([category, stock]: [string, any]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        {stock.toLocaleString()} units
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No stock data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentActivities &&
            dashboardData.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivities
                  .slice(0, 5)
                  .map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === "inflow"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm">{activity.materialName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {activity.type === "inflow" ? "+" : "-"}
                        {activity.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 
        Here you would integrate the InventoryCharts component:
        <InventoryCharts 
          stockLevels={dashboardData.stockLevels} 
          recentActivities={dashboardData.recentActivities} 
        />
      */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            📊 Advanced visual charts will be rendered here when you integrate
            the InventoryCharts component. This would show category
            distribution, activity trends, stock health metrics, and top moving
            materials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
