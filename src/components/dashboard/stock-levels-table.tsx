/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockLevel {
  materialId: string;
  materialName: string;
  categoryName: string;
  currentStock: number;
  minStockLevel: string | null;
  totalInflow: number;
  totalOutflow: number;
}

interface StockLevelsTableProps {
  stockLevels: StockLevel[];
}

export default function StockLevelsTable({
  stockLevels,
}: StockLevelsTableProps) {
  const getStockStatus = (currentStock: number, minLevel: string | null) => {
    const minStockLevel = parseFloat(minLevel || "0");

    if (currentStock <= 0) {
      return {
        status: "out-of-stock",
        color: "destructive",
        icon: AlertTriangle,
      };
    } else if (minStockLevel > 0 && currentStock <= minStockLevel) {
      return { status: "low-stock", color: "secondary", icon: AlertTriangle };
    } else {
      return { status: "in-stock", color: "default", icon: CheckCircle };
    }
  };

  const getStockPercentage = (
    currentStock: number,
    minLevel: string | null
  ) => {
    const minStockLevel = parseFloat(minLevel || "0");
    if (minStockLevel <= 0) return 100;

    const percentage = (currentStock / (minStockLevel * 2)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Current Stock Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Min Level</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Stock Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockLevels.slice(0, 10).map((item) => {
                const stockStatus = getStockStatus(
                  item.currentStock,
                  item.minStockLevel
                );
                const stockPercentage = getStockPercentage(
                  item.currentStock,
                  item.minStockLevel
                );
                const StatusIcon = stockStatus.icon;

                return (
                  <TableRow key={item.materialId}>
                    <TableCell className="font-medium">
                      {item.materialName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.categoryName}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.currentStock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.minStockLevel
                        ? parseFloat(item.minStockLevel).toLocaleString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stockStatus.color as any}
                        className="gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {stockStatus.status === "out-of-stock" &&
                          "Out of Stock"}
                        {stockStatus.status === "low-stock" && "Low Stock"}
                        {stockStatus.status === "in-stock" && "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={stockPercentage}
                          className={cn(
                            "flex-1 h-2",
                            stockStatus.status === "out-of-stock" &&
                              "[&>[data-state=complete]]:bg-red-500",
                            stockStatus.status === "low-stock" &&
                              "[&>[data-state=complete]]:bg-orange-500",
                            stockStatus.status === "in-stock" &&
                              "[&>[data-state=complete]]:bg-green-500"
                          )}
                        />

                        <span className="text-xs text-muted-foreground min-w-[3ch]">
                          {Math.round(stockPercentage)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {stockLevels.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing top 10 materials. Total: {stockLevels.length} materials
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
