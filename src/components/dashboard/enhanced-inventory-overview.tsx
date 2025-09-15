"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";

// Import our dashboard components
import DashboardSummaryCards from "@/components/dashboard/dashboard-summary-cards";
import StockLevelsTable from "@/components/dashboard/stock-levels-table";
import RecentActivities from "@/components/dashboard/recent-activities";
import LowStockAlerts from "@/components/dashboard/low-stock-alerts";

// Import filtering components
import FilterControls, {
  FilterValues,
} from "@/components/filters/filter-controls";
import { useFilters } from "@/hooks/use-filters";

// Import the dashboard hook
import { useDashboard } from "@/hooks/use-dashboard";

// Import inflow form if user can create inflows
import InflowForm from "@/components/forms/inflow-form";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";

export default function EnhancedInventoryOverview() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();
  const [showInflowForm, setShowInflowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const canEdit = canManageInventory(session?.user?.role as UserRole);

  // Filter state management
  const {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    getDateRange,
  } = useFilters({
    defaultFilters: {},
    syncWithUrl: true,
  });

  // Filter dashboard data based on current filters
  const filteredDashboardData = useMemo(() => {
    if (!dashboardData) return null;

    const dateRange = getDateRange();

    // Filter stock levels
    const filteredStockLevels = dashboardData.stockLevels.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [item.materialName, item.categoryName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Category filter
      if (filters.categoryId) {
        // Note: We'd need categoryId in the stock levels data for this to work
        // For now, we'll filter by category name
        const categoryName = dashboardData.stockLevels.find(
          (s) => s.materialId === item.materialId
        )?.categoryName;
        if (categoryName && !categoryName.includes(filters.categoryId)) {
          return false;
        }
      }

      // Material filter
      if (filters.materialId && item.materialId !== filters.materialId) {
        return false;
      }

      return true;
    });

    // Filter recent activities
    const filteredActivities = dashboardData.recentActivities.filter(
      (activity) => {
        // Search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchableText = [
            activity.materialName,
            activity.projectName,
            activity.person,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchableText.includes(searchTerm)) {
            return false;
          }
        }

        // Project filter
        if (filters.projectId && activity.projectName) {
          // We'd need projectId for exact matching, using name for now
          if (!activity.projectName.includes(filters.projectId)) {
            return false;
          }
        }

        // Material filter
        if (filters.materialId && activity.materialName) {
          // Similar issue - we'd need materialId for exact matching
          if (!activity.materialName.includes(filters.materialId)) {
            return false;
          }
        }

        // Date range filter
        if (dateRange) {
          const activityDate = new Date(activity.date);
          if (dateRange.from && activityDate < dateRange.from) {
            return false;
          }
          if (dateRange.to && activityDate > dateRange.to) {
            return false;
          }
        }

        return true;
      }
    );

    // Filter low stock alerts using same logic as stock levels
    const filteredLowStockAlerts = dashboardData.lowStockAlerts.filter(
      (item) => {
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchableText = [item.materialName, item.categoryName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchableText.includes(searchTerm)) {
            return false;
          }
        }

        if (filters.materialId && item.materialId !== filters.materialId) {
          return false;
        }

        return true;
      }
    );

    // Recalculate summary based on filtered data
    const filteredSummary = {
      totalMaterials: filteredStockLevels.length,
      lowStockMaterials: filteredLowStockAlerts.filter(
        (item) =>
          parseFloat(item.minStockLevel || "0") > 0 &&
          item.currentStock <= parseFloat(item.minStockLevel || "0") &&
          item.currentStock > 0
      ).length,
      outOfStockMaterials: filteredLowStockAlerts.filter(
        (item) => item.currentStock <= 0
      ).length,
      totalStockValue: filteredStockLevels.reduce(
        (acc, item) => acc + item.currentStock * 0, // TODO: Add pricing
        0
      ),
    };

    return {
      summary: filteredSummary,
      stockLevels: filteredStockLevels,
      recentActivities: filteredActivities,
      lowStockAlerts: filteredLowStockAlerts,
    };
  }, [dashboardData, filters, getDateRange]);

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateInflow = () => {
    setShowInflowForm(true);
  };

  const handleExportDashboard = () => {
    if (!filteredDashboardData) return;

    const csvContent = [
      // Stock levels section
      "Stock Levels",
      "Material,Category,Current Stock,Min Level,Status",
      ...filteredDashboardData.stockLevels.map(
        (item) =>
          `"${item.materialName}","${item.categoryName}",${item.currentStock},${
            item.minStockLevel || "N/A"
          },"${
            item.currentStock <= 0
              ? "Out of Stock"
              : parseFloat(item.minStockLevel || "0") > 0 &&
                item.currentStock <= parseFloat(item.minStockLevel || "0")
              ? "Low Stock"
              : "In Stock"
          }"`
      ),
      "",
      // Recent activities section
      "Recent Activities",
      "Type,Material,Quantity,Project,Date,Person",
      ...filteredDashboardData.recentActivities.map(
        (activity) =>
          `"${activity.type}","${activity.materialName}","${
            activity.quantity
          }","${activity.projectName}","${new Date(
            activity.date
          ).toLocaleDateString()}","${activity.person}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-dashboard-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[400px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>

        {/* Filter Skeleton */}
        <Skeleton className="h-16 w-full" />

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
  if (!dashboardData || !filteredDashboardData) {
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
            {hasActiveFilters && (
              <span className="ml-2 text-sm">
                • Filtered view ({filteredDashboardData.stockLevels.length} of{" "}
                {dashboardData.stockLevels.length} materials)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            {showFilters ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showFilters ? "Hide" : "Show"} Filters
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportDashboard}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Filter Controls - Collapsible */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <FilterControls
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            availableFilters={{
              search: true,
              project: true,
              category: true,
              material: true,
              dateRange: true,
              status: false,
            }}
          />
        </div>
      )}

      {/* Summary Cards */}
      <DashboardSummaryCards summary={filteredDashboardData.summary} />

      {/* Filter Summary Banner */}
      {hasActiveFilters && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Filtered Results:
              </span>
              <span className="text-blue-700">
                Showing {filteredDashboardData.stockLevels.length} of{" "}
                {dashboardData.stockLevels.length} materials
                {filters.dateRange && (
                  <span className="ml-2">
                    • {filteredDashboardData.recentActivities.length} activities
                    in date range
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Stock Levels Table */}
        <div className="lg:col-span-2">
          <StockLevelsTable stockLevels={filteredDashboardData.stockLevels} />
        </div>

        {/* Right Column - Alerts and Activities */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlerts
            lowStockItems={filteredDashboardData.lowStockAlerts}
            onCreateInflow={canEdit ? handleCreateInflow : undefined}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <RecentActivities activities={filteredDashboardData.recentActivities} />

      {/* Additional Stats Row - Updated with filtered data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Inflows {hasActiveFilters && "(Filtered)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                filteredDashboardData.recentActivities.filter(
                  (activity) => activity.type === "inflow"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Materials received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Outflows {hasActiveFilters && "(Filtered)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                filteredDashboardData.recentActivities.filter(
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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Active Projects {hasActiveFilters && "(Filtered)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                new Set(
                  filteredDashboardData.recentActivities.map(
                    (a) => a.projectName
                  )
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
