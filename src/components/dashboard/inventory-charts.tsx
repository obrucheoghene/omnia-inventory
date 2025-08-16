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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface StockLevel {
  materialId: string;
  materialName: string;
  categoryName: string;
  currentStock: number;
  minStockLevel: string | null;
  totalInflow: number;
  totalOutflow: number;
}

interface Activity {
  id: string;
  type: "inflow" | "outflow";
  materialName: string;
  quantity: string;
  unitName: string;
  projectName: string;
  date: Date;
  person: string;
  createdAt: Date;
}

interface InventoryChartsProps {
  stockLevels: StockLevel[];
  recentActivities: Activity[];
}

export default function InventoryCharts({
  stockLevels,
  recentActivities,
}: InventoryChartsProps) {
  // Stock distribution by category
  const categoryDistribution = useMemo(() => {
    const categoryData = stockLevels.reduce((acc, item) => {
      const category = item.categoryName || "Uncategorized";
      if (!acc[category]) {
        acc[category] = {
          category,
          totalStock: 0,
          materials: 0,
          lowStock: 0,
          outOfStock: 0,
        };
      }
      acc[category].totalStock += item.currentStock;
      acc[category].materials += 1;

      const minLevel = parseFloat(item.minStockLevel || "0");
      if (item.currentStock <= 0) {
        acc[category].outOfStock += 1;
      } else if (minLevel > 0 && item.currentStock <= minLevel) {
        acc[category].lowStock += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(categoryData).sort(
      (a: any, b: any) => b.totalStock - a.totalStock
    );
  }, [stockLevels]);

  // Activity trends (last 7 activities)
  const activityTrends = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    return last7Days.map((date) => {
      const dayActivities = recentActivities.filter((activity) => {
        const activityDate = new Date(activity.date)
          .toISOString()
          .split("T")[0];
        return activityDate === date;
      });

      const inflows = dayActivities.filter((a) => a.type === "inflow").length;
      const outflows = dayActivities.filter((a) => a.type === "outflow").length;

      return {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        inflows,
        outflows,
        total: inflows + outflows,
      };
    });
  }, [recentActivities]);

  // Top moving materials
  const topMovingMaterials = useMemo(() => {
    const materialActivity = recentActivities.reduce((acc, activity) => {
      const material = activity.materialName;
      if (!acc[material]) {
        acc[material] = { name: material, activities: 0, quantity: 0 };
      }
      acc[material].activities += 1;
      acc[material].quantity += parseFloat(activity.quantity || "0");
      return acc;
    }, {} as Record<string, any>);

    return Object.values(materialActivity)
      .sort((a: any, b: any) => b.activities - a.activities)
      .slice(0, 5);
  }, [recentActivities]);

  // Stock health metrics
  const stockHealth = useMemo(() => {
    const total = stockLevels.length;
    const inStock = stockLevels.filter((item) => {
      const minLevel = parseFloat(item.minStockLevel || "0");
      return item.currentStock > minLevel && item.currentStock > 0;
    }).length;
    const lowStock = stockLevels.filter((item) => {
      const minLevel = parseFloat(item.minStockLevel || "0");
      return (
        minLevel > 0 && item.currentStock <= minLevel && item.currentStock > 0
      );
    }).length;
    const outOfStock = stockLevels.filter(
      (item) => item.currentStock <= 0
    ).length;

    return {
      total,
      inStock,
      lowStock,
      outOfStock,
      healthPercentage: total > 0 ? ((inStock / total) * 100).toFixed(1) : "0",
    };
  }, [stockLevels]);

  const maxCategoryStock = Math.max(
    ...categoryDistribution.map((cat: any) => cat.totalStock),
    1
  );
  const maxActivityCount = Math.max(
    ...activityTrends.map((day) => day.total),
    1
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stock by Category
          </CardTitle>
          <CardDescription>
            Material distribution across categories with alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryDistribution.slice(0, 6).map((category: any, index) => {
            const percentage = (category.totalStock / maxCategoryStock) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {category.category}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {category.materials} items
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {category.outOfStock > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {category.outOfStock} out
                      </Badge>
                    )}
                    {category.lowStock > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {category.lowStock} low
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {category.totalStock.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Trends (7 Days)
          </CardTitle>
          <CardDescription>
            Daily inflow and outflow activity patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityTrends.map((day, index) => {
            const activityPercentage = (day.total / maxActivityCount) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">
                        {day.inflows}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">
                        {day.outflows}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{day.total}</span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={activityPercentage} className="h-2" />
                  {day.inflows > 0 && day.outflows > 0 && (
                    <div
                      className="absolute top-0 left-0 h-2 bg-green-500 rounded-l-full"
                      style={{
                        width: `${
                          (day.inflows / day.total) * activityPercentage
                        }%`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stock Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Health
          </CardTitle>
          <CardDescription>
            Overall stock status and availability metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Score */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-green-600">
              {stockHealth.healthPercentage}%
            </div>
            <div className="text-sm text-muted-foreground">
              Materials with adequate stock
            </div>
            <Progress
              value={parseFloat(stockHealth.healthPercentage)}
              className="h-3"
            />
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-lg font-bold text-green-600">
                {stockHealth.inStock}
              </div>
              <div className="text-xs text-muted-foreground">In Stock</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-lg font-bold text-orange-600">
                {stockHealth.lowStock}
              </div>
              <div className="text-xs text-muted-foreground">Low Stock</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-lg font-bold text-red-600">
                {stockHealth.outOfStock}
              </div>
              <div className="text-xs text-muted-foreground">Out of Stock</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Materials:</span>
              <span className="font-medium">{stockHealth.total}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-green-600">
                {stockHealth.inStock + stockHealth.lowStock}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Moving Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Most Active Materials
          </CardTitle>
          <CardDescription>
            Materials with highest recent activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topMovingMaterials.length > 0 ? (
            topMovingMaterials.map((material: any, index) => {
              const maxActivities = topMovingMaterials[0]?.activities || 1;
              const activityPercentage =
                (material.activities / maxActivities) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{material.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {material.activities} moves
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {material.quantity.toLocaleString()} units
                      </span>
                    </div>
                  </div>
                  <Progress value={activityPercentage} className="h-2" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent material activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
