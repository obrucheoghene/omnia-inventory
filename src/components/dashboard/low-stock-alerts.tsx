"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, Plus, Bell } from "lucide-react";

interface LowStockItem {
  materialId: string;
  materialName: string;
  categoryName: string;
  currentStock: number;
  minStockLevel: string | null;
}

interface LowStockAlertsProps {
  lowStockItems: LowStockItem[];
  onCreateInflow?: () => void;
}

export default function LowStockAlerts({
  lowStockItems,
  onCreateInflow,
}: LowStockAlertsProps) {
  const outOfStockItems = lowStockItems.filter(
    (item) => item.currentStock <= 0
  );
  const lowStockItems_filtered = lowStockItems.filter(
    (item) =>
      item.currentStock > 0 &&
      parseFloat(item.minStockLevel || "0") > 0 &&
      item.currentStock <= parseFloat(item.minStockLevel || "0")
  );

  if (lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Bell className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-green-600 font-medium">
              All materials are well stocked!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No low stock alerts at this time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Stock Alerts
          <Badge variant="destructive" className="ml-auto">
            {lowStockItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Out of Stock Items */}
        {outOfStockItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Out of Stock ({outOfStockItems.length})
            </h4>
            {outOfStockItems.map((item) => (
              <Alert key={item.materialId} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.materialName}</p>
                    <p className="text-xs opacity-80">{item.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">0 units</p>
                    <p className="text-xs">
                      Min:{" "}
                      {item.minStockLevel
                        ? parseFloat(item.minStockLevel).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Low Stock Items */}
        {lowStockItems_filtered.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock ({lowStockItems_filtered.length})
            </h4>
            {lowStockItems_filtered.map((item) => {
              const minLevel = parseFloat(item.minStockLevel || "0");
              const percentage =
                minLevel > 0 ? (item.currentStock / minLevel) * 100 : 0;

              return (
                <Alert key={item.materialId}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.categoryName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {item.currentStock.toLocaleString()} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {minLevel.toLocaleString()} (
                        {Math.round(percentage)}%)
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        {onCreateInflow && lowStockItems.length > 0 && (
          <div className="pt-2">
            <Button onClick={onCreateInflow} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Record New Inflow
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
