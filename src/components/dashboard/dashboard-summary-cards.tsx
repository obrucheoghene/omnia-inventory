"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

interface DashboardSummaryProps {
  summary: {
    totalMaterials: number;
    lowStockMaterials: number;
    outOfStockMaterials: number;
    totalStockValue: number;
  };
}

export default function DashboardSummaryCards({
  summary,
}: DashboardSummaryProps) {
  const cards = [
    {
      title: "Total Materials",
      value: summary.totalMaterials.toLocaleString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Low Stock Items",
      value: summary.lowStockMaterials.toLocaleString(),
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      badge: summary.lowStockMaterials > 0 ? "warning" : undefined,
    },
    {
      title: "Out of Stock",
      value: summary.outOfStockMaterials.toLocaleString(),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      badge: summary.outOfStockMaterials > 0 ? "critical" : undefined,
    },
    {
      title: "Total Stock Value",
      value: `$${summary.totalStockValue.toLocaleString()}`,
      icon: DollarSign,

      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              {card.badge && (
                <Badge
                  variant={
                    card.badge === "critical" ? "destructive" : "secondary"
                  }
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  !
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
