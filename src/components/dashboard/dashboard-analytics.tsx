/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  Building2,
  Package2,
  AlertCircle,
  Activity,
} from "lucide-react";

interface DashboardAnalyticsProps {
  dashboardData: {
    summary: {
      totalMaterials: number;
      lowStockMaterials: number;
      outOfStockMaterials: number;
      totalStockValue: number;
    };
    stockLevels: Array<{
      materialId: string;
      materialName: string;
      categoryName: string;
      currentStock: number;
      minStockLevel: string | null;
      totalInflow: number;
      totalOutflow: number;
    }>;
    recentActivities: Array<{
      id: string;
      type: "inflow" | "outflow";
      materialName: string;
      quantity: string;
      unitName: string;
      projectName: string;
      date: Date;
      person: string;
      createdAt: Date;
    }>;
    lowStockAlerts: Array<{
      materialId: string;
      materialName: string;
      categoryName: string;
      currentStock: number;
      minStockLevel: string | null;
    }>;
  };
}

export default function DashboardAnalytics({
  dashboardData,
}: DashboardAnalyticsProps) {
  // Calculate velocity metrics
  const velocityMetrics = useMemo(() => {
    const { recentActivities } = dashboardData;

    // Get activities from last 7 days
    const last7Days = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return activityDate >= cutoff;
    });

    // Get activities from previous 7 days for comparison
    const previous7Days = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.date);
      const cutoffStart = new Date();
      cutoffStart.setDate(cutoffStart.getDate() - 14);
      const cutoffEnd = new Date();
      cutoffEnd.setDate(cutoffEnd.getDate() - 7);
      return activityDate >= cutoffStart && activityDate < cutoffEnd;
    });

    const currentInflows = last7Days.filter((a) => a.type === "inflow").length;
    const currentOutflows = last7Days.filter(
      (a) => a.type === "outflow"
    ).length;
    const previousInflows = previous7Days.filter(
      (a) => a.type === "inflow"
    ).length;
    const previousOutflows = previous7Days.filter(
      (a) => a.type === "outflow"
    ).length;

    const inflowTrend =
      previousInflows > 0
        ? ((currentInflows - previousInflows) / previousInflows) * 100
        : currentInflows > 0
        ? 100
        : 0;

    const outflowTrend =
      previousOutflows > 0
        ? ((currentOutflows - previousOutflows) / previousOutflows) * 100
        : currentOutflows > 0
        ? 100
        : 0;

    return {
      currentInflows,
      currentOutflows,
      inflowTrend,
      outflowTrend,
      totalActivity: currentInflows + currentOutflows,
      activityTrend:
        ((currentInflows +
          currentOutflows -
          (previousInflows + previousOutflows)) /
          Math.max(previousInflows + previousOutflows, 1)) *
        100,
    };
  }, [dashboardData.recentActivities]);

  // Project utilization
  const projectUtilization = useMemo(() => {
    const projectData = dashboardData.recentActivities.reduce(
      (acc, activity) => {
        const project = activity.projectName;
        if (!acc[project]) {
          acc[project] = {
            name: project,
            activities: 0,
            inflows: 0,
            outflows: 0,
            lastActivity: new Date(activity.date),
          };
        }
        acc[project].activities += 1;
        if (activity.type === "inflow") acc[project].inflows += 1;
        else acc[project].outflows += 1;

        if (new Date(activity.date) > acc[project].lastActivity) {
          acc[project].lastActivity = new Date(activity.date);
        }

        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(projectData)
      .sort((a: any, b: any) => b.activities - a.activities)
      .slice(0, 5);
  }, [dashboardData.recentActivities]);

  // Material turnover
  const materialTurnover = useMemo(() => {
    return dashboardData.stockLevels
      .map((material) => {
        const turnoverRate =
          material.totalOutflow > 0
            ? material.totalOutflow / Math.max(material.currentStock, 1)
            : 0;

        return {
          ...material,
          turnoverRate,
          velocity: material.totalInflow + material.totalOutflow,
        };
      })
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 8);
  }, [dashboardData.stockLevels]);

  // Stock efficiency
  const stockEfficiency = useMemo(() => {
    const { stockLevels } = dashboardData;
    const totalMaterials = stockLevels.length;

    if (totalMaterials === 0) return { efficiency: 0, categories: [] };

    // Calculate efficiency score based on stock levels vs minimum levels
    const efficientMaterials = stockLevels.filter((material) => {
      const minLevel = parseFloat(material.minStockLevel || "0");
      if (minLevel <= 0) return true; // No min level set, consider efficient
      return material.currentStock >= minLevel * 1.2; // 20% buffer above min level
    });

    const efficiency = (efficientMaterials.length / totalMaterials) * 100;

    // Category breakdown
    const categoryEfficiency = stockLevels.reduce((acc, material) => {
      const category = material.categoryName || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, efficient: 0 };
      }
      acc[category].total += 1;

      const minLevel = parseFloat(material.minStockLevel || "0");
      if (minLevel <= 0 || material.currentStock >= minLevel * 1.2) {
        acc[category].efficient += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    const categories = Object.entries(categoryEfficiency)
      .map(([name, data]: [string, any]) => ({
        name,
        efficiency: (data.efficient / data.total) * 100,
        total: data.total,
        efficient: data.efficient,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    return { efficiency, categories };
  }, [dashboardData.stockLevels]);

  // Activity patterns by day
  const activityPatterns = useMemo(() => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const dayData = days.map((day) => ({
      day,
      activities: 0,
      inflows: 0,
      outflows: 0,
    }));

    dashboardData.recentActivities.forEach((activity) => {
      const dayIndex = new Date(activity.date).getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for Monday start
      const dayObj = dayData.find((d) => d.day === dayName);

      if (dayObj) {
        dayObj.activities += 1;
        if (activity.type === "inflow") dayObj.inflows += 1;
        else dayObj.outflows += 1;
      }
    });

    const maxActivities = Math.max(...dayData.map((d) => d.activities), 1);
    return dayData.map((day) => ({
      ...day,
      percentage: (day.activities / maxActivities) * 100,
    }));
  }, [dashboardData.recentActivities]);

  // Critical materials (low stock with high activity)
  const criticalMaterials = useMemo(() => {
    const materialActivity = dashboardData.recentActivities.reduce(
      (acc, activity) => {
        const materialName = activity.materialName;
        if (!acc[materialName]) {
          acc[materialName] = 0;
        }
        acc[materialName] += 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return dashboardData.lowStockAlerts
      .map((material) => ({
        ...material,
        recentActivity: materialActivity[material.materialName] || 0,
        criticality:
          (materialActivity[material.materialName] || 0) *
          (material.minStockLevel
            ? Math.max(
                0,
                parseFloat(material.minStockLevel) - material.currentStock
              )
            : 1),
      }))
      .sort((a, b) => b.criticality - a.criticality)
      .slice(0, 5);
  }, [dashboardData.lowStockAlerts, dashboardData.recentActivities]);

  return (
    <div className="space-y-6">
      {/* Velocity Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {velocityMetrics.totalActivity}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {velocityMetrics.activityTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {Math.abs(velocityMetrics.activityTrend).toFixed(1)}% from last
              week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inflow Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {velocityMetrics.currentInflows}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {velocityMetrics.inflowTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {Math.abs(velocityMetrics.inflowTrend).toFixed(1)}% trend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outflow Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {velocityMetrics.currentOutflows}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {velocityMetrics.outflowTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {Math.abs(velocityMetrics.outflowTrend).toFixed(1)}% trend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Efficiency
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stockEfficiency.efficiency.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Materials above target levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Project Activity
            </CardTitle>
            <CardDescription>Most active projects this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectUtilization.map((project: any, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {project.activities} moves
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {project.lastActivity.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Inflows</span>
                        <span>{project.inflows}</span>
                      </div>
                      <Progress
                        value={(project.inflows / project.activities) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Outflows</span>
                        <span>{project.outflows}</span>
                      </div>
                      <Progress
                        value={(project.outflows / project.activities) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Material Turnover */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Material Turnover
            </CardTitle>
            <CardDescription>
              Materials with highest activity rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Turnover</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialTurnover.slice(0, 5).map((material) => (
                  <TableRow key={material.materialId}>
                    <TableCell className="font-medium text-sm">
                      {material.materialName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          material.turnoverRate > 1
                            ? "destructive"
                            : material.turnoverRate > 0.5
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {material.turnoverRate.toFixed(2)}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {material.currentStock.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Weekly Patterns
            </CardTitle>
            <CardDescription>
              Activity distribution by day of week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityPatterns.map((day) => (
              <div key={day.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600">
                      +{day.inflows}
                    </span>
                    <span className="text-xs text-red-600">
                      -{day.outflows}
                    </span>
                    <span className="text-sm">{day.activities}</span>
                  </div>
                </div>
                <Progress value={day.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Critical Materials
            </CardTitle>
            <CardDescription>
              Low stock items with high activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criticalMaterials.length > 0 ? (
              <div className="space-y-3">
                {criticalMaterials.map((material) => (
                  <div
                    key={material.materialId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {material.materialName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {material.categoryName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {material.currentStock} units
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {material.recentActivity} recent moves
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No critical materials identified</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
