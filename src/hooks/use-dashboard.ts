import { useQuery } from "@tanstack/react-query";

interface DashboardData {
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
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch("/api/inventory/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
