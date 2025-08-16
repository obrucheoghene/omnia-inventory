/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Building2,
  Target,
  AlertTriangle,
  Activity,
  Users,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useInflows } from "@/hooks/use-inflows";
import { useOutflows } from "@/hooks/use-outflows";
import { useProjects } from "@/hooks/use-projects";
import { useCategories } from "@/hooks/use-categories";
import { formatDate } from "@/lib/utils";

// interface ReportsPageProps {}

export default function ReportsPage() {
  const { data: session } = useSession();
  const { data: dashboardData } = useDashboard();
  const { data: inflows } = useInflows(1, 1000); // Get more records for reports
  const { data: outflows } = useOutflows(1, 1000);
  const { data: projects } = useProjects();
  const { data: categories } = useCategories();

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Helper function to filter data by period
  const filterDataByPeriod = (data: any[], dateField: string) => {
    const now = new Date();
    const periods = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };

    if (selectedPeriod === "all") return data;

    const startDate = periods[selectedPeriod as keyof typeof periods];
    return data.filter((item) => new Date(item[dateField]) >= startDate);
  };

  // Stock levels by category
  const stockByCategory = useMemo(() => {
    if (!dashboardData?.stockLevels) return [];

    const categoryData = dashboardData.stockLevels.reduce((acc, item) => {
      const category = item.categoryName || "Uncategorized";
      if (!acc[category]) {
        acc[category] = {
          category,
          totalStock: 0,
          materialCount: 0,
          lowStock: 0,
          outOfStock: 0,
        };
      }
      acc[category].totalStock += item.currentStock;
      acc[category].materialCount += 1;

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
  }, [dashboardData?.stockLevels]);

  // Project activity data
  const projectActivity = useMemo(() => {
    if (!inflows || !outflows || !projects) return [];

    const filteredInflows = filterDataByPeriod(inflows, "deliveryDate");
    const filteredOutflows = filterDataByPeriod(outflows, "releaseDate");

    const projectData = projects
      .map((project) => {
        const projectInflows = filteredInflows.filter(
          (i) => i.projectId === project.id
        );
        const projectOutflows = filteredOutflows.filter(
          (o) => o.projectId === project.id
        );

        const totalInflowValue = projectInflows.reduce(
          (sum, i) => sum + parseFloat(i.totalValue || "0"),
          0
        );
        const totalOutflowValue = projectOutflows.reduce(
          (sum, o) => sum + parseFloat(o.totalValue || "0"),
          0
        );

        return {
          id: project.id,
          name: project.name,
          inflows: projectInflows.reduce(
            (sum, i) => sum + parseFloat(i.quantity || "0"),
            0
          ),
          outflows: projectOutflows.reduce(
            (sum, o) => sum + parseFloat(o.quantity || "0"),
            0
          ),
          activities: projectInflows.length + projectOutflows.length,
          inflowValue: totalInflowValue,
          outflowValue: totalOutflowValue,
          lastActivity: Math.max(
            ...projectInflows.map((i) => new Date(i.createdAt).getTime()),
            ...projectOutflows.map((o) => new Date(o.createdAt).getTime()),
            0
          ),
        };
      })
      .sort((a, b) => b.activities - a.activities);

    return projectData;
  }, [inflows, outflows, projects, selectedPeriod]);

  // Recent activity summary
  const activitySummary = useMemo(() => {
    if (!inflows || !outflows)
      return { inflows: 0, outflows: 0, totalValue: 0 };

    const filteredInflows = filterDataByPeriod(inflows, "deliveryDate");
    const filteredOutflows = filterDataByPeriod(outflows, "releaseDate");

    const totalInflowValue = filteredInflows.reduce(
      (sum, i) => sum + parseFloat(i.totalValue || "0"),
      0
    );
    const totalOutflowValue = filteredOutflows.reduce(
      (sum, o) => sum + parseFloat(o.totalValue || "0"),
      0
    );

    return {
      inflows: filteredInflows.length,
      outflows: filteredOutflows.length,
      totalValue: totalInflowValue + totalOutflowValue,
      inflowQuantity: filteredInflows.reduce(
        (sum, i) => sum + parseFloat(i.quantity || "0"),
        0
      ),
      outflowQuantity: filteredOutflows.reduce(
        (sum, o) => sum + parseFloat(o.quantity || "0"),
        0
      ),
    };
  }, [inflows, outflows, selectedPeriod]);

  // Top materials by activity
  const topMaterials = useMemo(() => {
    if (!inflows || !outflows || !dashboardData?.stockLevels) return [];

    const filteredInflows = filterDataByPeriod(inflows, "deliveryDate");
    const filteredOutflows = filterDataByPeriod(outflows, "releaseDate");

    const materialActivity = {} as Record<string, any>;

    filteredInflows.forEach((inflow) => {
      const materialId = inflow.materialId;
      if (!materialActivity[materialId]) {
        materialActivity[materialId] = {
          materialId,
          materialName: inflow.materialName,
          inflows: 0,
          outflows: 0,
          activities: 0,
        };
      }
      materialActivity[materialId].inflows += parseFloat(
        inflow.quantity || "0"
      );
      materialActivity[materialId].activities += 1;
    });

    filteredOutflows.forEach((outflow) => {
      const materialId = outflow.materialId;
      if (!materialActivity[materialId]) {
        materialActivity[materialId] = {
          materialId,
          materialName: outflow.materialName,
          inflows: 0,
          outflows: 0,
          activities: 0,
        };
      }
      materialActivity[materialId].outflows += parseFloat(
        outflow.quantity || "0"
      );
      materialActivity[materialId].activities += 1;
    });

    return Object.values(materialActivity)
      .sort((a: any, b: any) => b.activities - a.activities)
      .slice(0, 10);
  }, [inflows, outflows, dashboardData?.stockLevels, selectedPeriod]);

  const handleExportReport = (reportType: string) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${reportType}-report-${timestamp}.csv`;

    let csvContent = "";

    switch (reportType) {
      case "inventory":
        csvContent = generateInventoryReport();
        break;
      case "activity":
        csvContent = generateActivityReport();
        break;
      case "projects":
        csvContent = generateProjectReport();
        break;
      case "categories":
        csvContent = generateCategoryReport();
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateInventoryReport = () => {
    if (!dashboardData?.stockLevels) return "";

    const headers = [
      "Material",
      "Category",
      "Current Stock",
      "Min Level",
      "Status",
      "Total Inflow",
      "Total Outflow",
    ];
    const rows = dashboardData.stockLevels.map((item) => [
      item.materialName,
      item.categoryName,
      item.currentStock.toString(),
      item.minStockLevel || "N/A",
      item.currentStock <= 0
        ? "Out of Stock"
        : parseFloat(item.minStockLevel || "0") > 0 &&
          item.currentStock <= parseFloat(item.minStockLevel || "0")
        ? "Low Stock"
        : "In Stock",
      item.totalInflow.toString(),
      item.totalOutflow.toString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const generateActivityReport = () => {
    if (!inflows || !outflows) return "";

    const headers = [
      "Date",
      "Type",
      "Material",
      "Quantity",
      "Unit Price",
      "Total Value",
      "Project",
      "Person",
      "Purpose",
    ];
    const activities = [
      ...inflows.map((i) => [
        formatDate(new Date(i.deliveryDate)),
        "Inflow",
        i.materialName || "N/A",
        i.quantity,
        i.unitPrice || "N/A",
        i.totalValue || "N/A",
        i.projectName || "N/A",
        i.receivedBy,
        i.purpose || "N/A",
      ]),
      ...outflows.map((o) => [
        formatDate(new Date(o.releaseDate)),
        "Outflow",
        o.materialName || "N/A",
        o.quantity,
        o.unitPrice || "N/A",
        o.totalValue || "N/A",
        o.projectName || "N/A",
        o.authorizedBy,
        o.purpose || "N/A",
      ]),
    ].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    return [headers, ...activities]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const generateProjectReport = () => {
    const headers = [
      "Project",
      "Total Inflows",
      "Total Outflows",
      "Activities",
      "Inflow Value",
      "Outflow Value",
      "Net Value",
    ];
    const rows = projectActivity.map((project) => [
      project.name,
      project.inflows.toString(),
      project.outflows.toString(),
      project.activities.toString(),
      project.inflowValue.toFixed(2),
      project.outflowValue.toFixed(2),
      (project.inflowValue - project.outflowValue).toFixed(2),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const generateCategoryReport = () => {
    const headers = [
      "Category",
      "Total Materials",
      "Total Stock",
      "Low Stock Items",
      "Out of Stock Items",
    ];
    const rows = stockByCategory.map((cat) => [
      cat.category,
      cat.materialCount.toString(),
      cat.totalStock.toString(),
      cat.lowStock.toString(),
      cat.outOfStock.toString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your inventory operations
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activitySummary.inflows + activitySummary.outflows}
            </div>
            <p className="text-xs text-muted-foreground">
              {activitySummary.inflows} inflows, {activitySummary.outflows}{" "}
              outflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Material Movement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{activitySummary.inflowQuantity}
            </div>
            <p className="text-xs text-muted-foreground">
              -{activitySummary.outflowQuantity} units distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${activitySummary.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Material value moved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="exports">Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stock by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Distribution by Category</CardTitle>
                <CardDescription>
                  Current inventory levels and status across categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stockByCategory.slice(0, 8).map((category, index) => {
                  const maxStock = Math.max(
                    ...stockByCategory.map((c) => c.totalStock)
                  );
                  const percentage = (category.totalStock / maxStock) * 100;

                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category.category}</span>
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
                          <span className="text-muted-foreground">
                            {category.totalStock.toLocaleString()} units
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.materialCount} materials</span>
                        <span>{percentage.toFixed(1)}% of max</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Stock Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Health Status</CardTitle>
                <CardDescription>
                  Overall material availability and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {(dashboardData?.summary?.totalMaterials || 0) -
                        (dashboardData?.summary?.lowStockMaterials || 0) -
                        (dashboardData?.summary?.outOfStockMaterials || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      In Stock
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData?.summary?.lowStockMaterials || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Low Stock
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-red-600">
                      {dashboardData?.summary?.outOfStockMaterials || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Out of Stock
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Inventory Health</span>
                    <span className="font-medium">
                      {(
                        (((dashboardData?.summary?.totalMaterials || 0) -
                          (dashboardData?.summary?.outOfStockMaterials || 0)) /
                          (dashboardData?.summary?.totalMaterials || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (((dashboardData?.summary?.totalMaterials || 0) -
                        (dashboardData?.summary?.outOfStockMaterials || 0)) /
                        (dashboardData?.summary?.totalMaterials || 1)) *
                      100
                    }
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of materials with available stock
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Activity Analysis</CardTitle>
              <CardDescription>
                Material usage and activity breakdown by project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead className="text-right">Inflows</TableHead>
                    <TableHead className="text-right">Outflows</TableHead>
                    <TableHead className="text-right">Activities</TableHead>
                    <TableHead className="text-right">Value ($)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectActivity.slice(0, 10).map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{project.inflows.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{project.outflows.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {project.activities}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {(
                          project.inflowValue + project.outflowValue
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {project.activities > 0 ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Materials by Activity</CardTitle>
              <CardDescription>
                Most frequently moved materials in selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead className="text-right">Inflows</TableHead>
                    <TableHead className="text-right">Outflows</TableHead>
                    <TableHead className="text-right">Net Movement</TableHead>
                    <TableHead className="text-right">Activities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMaterials.map((material) => (
                    <TableRow key={material.materialId}>
                      <TableCell className="font-medium">
                        {material.materialName}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{material.inflows.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{material.outflows.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            material.inflows - material.outflows >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {material.inflows - material.outflows >= 0 ? "+" : ""}
                          {(
                            material.inflows - material.outflows
                          ).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{material.activities}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="exports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Report
                </CardTitle>
                <CardDescription>
                  Complete stock levels and material status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExportReport("inventory")}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Inventory
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Report
                </CardTitle>
                <CardDescription>
                  All inflows and outflows with details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExportReport("activity")}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Activity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Project Report
                </CardTitle>
                <CardDescription>
                  Material usage summary by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExportReport("projects")}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Projects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Category Report
                </CardTitle>
                <CardDescription>
                  Stock distribution by categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExportReport("categories")}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Categories
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Information</CardTitle>
              <CardDescription>
                Details about available report exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Report Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV format for easy data manipulation</li>
                    <li>• Filtered by current period selection</li>
                    <li>• Includes comprehensive data fields</li>
                    <li>• Compatible with Excel and Google Sheets</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Data Included</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Material quantities and values</li>
                    <li>• Project assignments and purposes</li>
                    <li>• Personnel and authorization details</li>
                    <li>• Timestamps and document references</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Current filter:</strong>{" "}
                  {selectedPeriod === "all"
                    ? "All time"
                    : `Last ${selectedPeriod}`}
                  {selectedProject !== "all" &&
                    ` • Project: ${
                      projects?.find((p) => p.id === selectedProject)?.name
                    }`}
                  {selectedCategory !== "all" &&
                    ` • Category: ${
                      categories?.find((c) => c.id === selectedCategory)?.name
                    }`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
