"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  ArrowUpDown,
  ChevronDown,
  Settings2,
  TrendingDown,
  Package,
  Download,
  FileText,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { useOutflows, useDeleteOutflow } from "@/hooks/use-outflows";
import { Outflow } from "@/lib/db/schema";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import OutflowForm from "@/components/forms/outflow-form";
import FilterControls, {
  FilterValues,
} from "@/components/filters/filter-controls";
import { useFilters } from "@/hooks/use-filters";
import { formatDate } from "@/lib/utils";

// Type for outflow data with joined fields from the API
interface OutflowWithJoins extends Outflow {
  materialName?: string;
  unitName?: string;
  projectName?: string;
}

export default function OutflowsTable() {
  const { data: session } = useSession();
  const { data: outflows, isLoading, error } = useOutflows();
  const deleteOutflow = useDeleteOutflow();

  const [selectedOutflow, setSelectedOutflow] =
    useState<OutflowWithJoins | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [showFilters, setShowFilters] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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

  const canEdit = canManageInventory(session?.user?.role as UserRole);

  // Helper function to count active filters with proper type handling
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "search") {
        return typeof value === "string" && value.length > 0;
      }
      if (key === "dateRange") {
        return (
          value &&
          typeof value === "object" &&
          (value.from || value.to || value.preset)
        );
      }
      return value && value !== "";
    }).length;
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!outflows) return [];

    return outflows.filter((outflow) => {
      // Search filter - comprehensive search across multiple fields
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          outflow.materialName || "",
          outflow.authorizedBy || "",
          outflow.receivedBy || "",
          outflow.purpose || "",
          outflow.projectName || "",
          outflow.unitName || "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Project filter - exact match
      if (filters.projectId && outflow.projectId !== filters.projectId) {
        return false;
      }

      // Category filter - needs to be implemented through material relationship
      if (filters.categoryId) {
        // Note: This would require categoryId to be included in the outflows data
        // For now, we'll skip this filter or you'll need to modify your API to include categoryId
        // The filter UI will still show, but won't filter until backend provides categoryId
      }

      // Material filter - exact match
      if (filters.materialId && outflow.materialId !== filters.materialId) {
        return false;
      }

      // Status filter (for return status) - enhanced with more conditions
      if (filters.status) {
        if (filters.status === "returned" && !outflow.isReturned) {
          return false;
        }
        if (
          filters.status === "pending-return" &&
          (outflow.isReturned || !outflow.returnDate)
        ) {
          return false;
        }
        if (
          filters.status === "released" &&
          (outflow.isReturned || outflow.returnDate)
        ) {
          return false;
        }
        if (filters.status === "overdue") {
          // Show items that should have been returned but weren't
          if (!outflow.returnDate || outflow.isReturned) {
            return false;
          }
          const returnDate = new Date(outflow.returnDate);
          const today = new Date();
          if (returnDate >= today) {
            return false;
          }
        }
      }

      // Date range filter - enhanced to handle different date types
      const dateRange = getDateRange();
      if (dateRange) {
        const outflowDate = new Date(outflow.releaseDate);
        if (dateRange.from && outflowDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && outflowDate > dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [outflows, filters, getDateRange]);

  const handleCreate = () => {
    setSelectedOutflow(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (outflow: OutflowWithJoins) => {
    setSelectedOutflow(outflow);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this outflow record?")) {
      try {
        await deleteOutflow.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting outflow:", error);
      }
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Material",
      "Quantity",
      "Unit",
      "Authorized By",
      "Received By",
      "Release Date",
      "Purpose",
      "Status",
      "Unit Price",
      "Total Value",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((outflow) => {
        let status = "Released";
        if (outflow.returnDate) {
          if (outflow.isReturned) {
            status = "Returned";
          } else {
            const returnDateObj = new Date(outflow.returnDate);
            const today = new Date();
            status =
              returnDateObj < today ? "Overdue Return" : "Pending Return";
          }
        }

        return [
          `"${outflow.materialName || "N/A"}"`,
          outflow.quantity,
          `"${outflow.unitName || "N/A"}"`,
          `"${outflow.authorizedBy || "N/A"}"`,
          `"${outflow.receivedBy || "N/A"}"`,
          new Date(outflow.releaseDate).toLocaleDateString(),
          `"${outflow.purpose || "N/A"}"`,
          status,
          outflow.unitPrice || "N/A",
          outflow.totalValue || "N/A",
        ].join(",");
      }),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outflows-${hasActiveFilters ? "filtered-" : ""}${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Status options for filtering - enhanced with more options
  const statusOptions = [
    { value: "released", label: "Released" },
    { value: "pending-return", label: "Pending Return" },
    { value: "returned", label: "Returned" },
    { value: "overdue", label: "Overdue Return" },
  ];

  // Column definitions
  const columns: ColumnDef<OutflowWithJoins>[] = [
    {
      accessorKey: "materialName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Material
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="font-medium">
            {row.getValue("materialName") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Quantity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quantity = parseFloat(row.getValue("quantity"));
        return (
          <div className="font-medium text-red-600">
            -{quantity.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "authorizedBy",
      header: "Authorized By",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("authorizedBy")}</div>
      ),
    },
    {
      accessorKey: "receivedBy",
      header: "Received By",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("receivedBy")}</div>
      ),
    },
    {
      accessorKey: "releaseDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Release Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("releaseDate"));
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => {
        const price = row.getValue("unitPrice") as string | null;
        return (
          <div className="text-sm">
            {price ? `$${parseFloat(price).toFixed(2)}` : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => {
        const value = row.getValue("totalValue") as string | null;
        return (
          <div className="text-sm font-medium">
            {value ? `$${parseFloat(value).toFixed(2)}` : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "isReturned",
      header: "Status",
      cell: ({ row }) => {
        const isReturned = row.getValue("isReturned") as boolean;
        const returnDate = row.original.returnDate;

        if (returnDate) {
          const returnDateObj = new Date(returnDate);
          const today = new Date();
          const isOverdue = !isReturned && returnDateObj < today;

          if (isReturned) {
            return <Badge variant="default">Returned</Badge>;
          } else if (isOverdue) {
            return <Badge variant="destructive">Overdue Return</Badge>;
          } else {
            return <Badge variant="secondary">Pending Return</Badge>;
          }
        }

        return <Badge variant="outline">Released</Badge>;
      },
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => {
        const purpose = row.getValue("purpose") as string;
        return (
          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
            {purpose}
          </div>
        );
      },
    },
  ];

  // Add actions column if user can edit
  if (canEdit) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const outflow = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(outflow)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(outflow.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading outflows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-600">
          Error loading outflows: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-red-600" />
            Material Outflows
          </h2>
          <p className="text-muted-foreground">
            Track materials distributed from the warehouse
            {hasActiveFilters && (
              <span className="ml-2 text-sm">
                • {filteredData.length} of {outflows?.length || 0} records
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Record Outflow
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
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
            Filters
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
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
              status: true,
            }}
            statusOptions={statusOptions}
          />
        </div>
      )}

      {/* Filter Summary Banner */}
      {hasActiveFilters && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">
                Filtered Results:
              </span>
              <span className="text-red-700">
                Showing {filteredData.length} of {outflows?.length || 0} outflow
                records
                {filters.status && (
                  <span className="ml-2">
                    • Status:{" "}
                    {
                      statusOptions.find((s) => s.value === filters.status)
                        ?.label
                    }
                  </span>
                )}
                {filters.dateRange && (
                  <span className="ml-2">• Date range applied</span>
                )}
                {filters.projectId && (
                  <span className="ml-2">• Filtered by project</span>
                )}
                {filters.materialId && (
                  <span className="ml-2">• Filtered by material</span>
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

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? `${filteredData.length} filtered`
              : `${outflows?.length || 0} total`}{" "}
            outflow(s)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <Settings2 className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <div className="text-sm">
                      {hasActiveFilters
                        ? "No outflows match your filters."
                        : "No outflows found."}
                    </div>
                    {hasActiveFilters ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-1"
                      >
                        Clear filters
                      </Button>
                    ) : (
                      canEdit && (
                        <div className="text-xs mt-1">
                          Click {`"Record Outflow"`} to add material
                          distributions.
                        </div>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {hasActiveFilters
            ? `${filteredData.length} of ${
                outflows?.length || 0
              } outflow(s) shown.`
            : `${outflows?.length || 0} outflow(s) total.`}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      <OutflowForm
        open={formOpen}
        onOpenChange={setFormOpen}
        outflow={selectedOutflow}
        mode={formMode}
      />
    </div>
  );
}
