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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  ArrowUpDown,
  ChevronDown,
  Settings2,
  TrendingUp,
  Package,
  Download,
  FileText,
} from "lucide-react";
import { useInflows, useDeleteInflow } from "@/hooks/use-inflows";
import { Inflow, InflowWithJoins } from "@/lib/db/schema";

import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import InflowForm from "@/components/forms/inflow-form";
import FilterControls, {
  FilterValues,
} from "@/components/filters/filter-controls";
import { useFilters } from "@/hooks/use-filters";
import { formatDate } from "@/lib/utils";

export default function EnhancedInflowsTable() {
  const { data: session } = useSession();
  const { data: inflows, isLoading, error } = useInflows();
  const deleteInflow = useDeleteInflow();

  const [selectedInflow, setSelectedInflow] = useState<InflowWithJoins | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

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

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!inflows) return [];

    return inflows.filter((inflow) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          inflow.materialName || "",
          inflow.supplierName || "",
          inflow.receivedBy || "",
          inflow.purpose || "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Project filter
      if (filters.projectId && inflow.projectId !== filters.projectId) {
        return false;
      }

      // Material filter
      if (filters.materialId && inflow.materialId !== filters.materialId) {
        return false;
      }

      // Date range filter
      const dateRange = getDateRange();
      if (dateRange) {
        const inflowDate = new Date(inflow.deliveryDate);
        if (dateRange.from && inflowDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && inflowDate > dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [inflows, filters, getDateRange]);

  const handleCreate = () => {
    setSelectedInflow(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (inflow: InflowWithJoins) => {
    setSelectedInflow(inflow);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inflow record?")) {
      try {
        await deleteInflow.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting inflow:", error);
      }
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Material",
      "Quantity",
      "Supplier",
      "Delivery Date",
      "Received By",
      "Purpose",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((inflow) =>
        [
          `"${inflow.materialName || "N/A"}"`,
          inflow.quantity,
          `"${inflow.supplierName || "N/A"}"`,
          new Date(inflow.deliveryDate).toLocaleDateString(),
          `"${inflow.receivedBy || "N/A"}"`,
          `"${inflow.purpose || "N/A"}"`,
        ].join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inflows-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Column definitions
  const columns: ColumnDef<InflowWithJoins>[] = [
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
          <div className="font-medium text-green-600">
            +{quantity.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("supplierName")}</div>
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
      accessorKey: "deliveryDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Delivery Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("deliveryDate"));
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
            {price ? `${parseFloat(price).toFixed(2)}` : "N/A"}
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
            {value ? `${parseFloat(value).toFixed(2)}` : "N/A"}
          </div>
        );
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
        const inflow = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(inflow)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(inflow.id)}
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
        <div className="text-sm text-muted-foreground">Loading inflows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-600">
          Error loading inflows: {error.message}
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
            <TrendingUp className="h-6 w-6 text-green-600" />
            Material Inflows
          </h2>
          <p className="text-muted-foreground">
            Track materials received into the warehouse
            {hasActiveFilters && (
              <span className="ml-2 text-sm">
                • {filteredData.length} of {inflows?.length || 0} records
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Record Inflow
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filter Controls */}
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
        className="mb-4"
      />

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? `${filteredData.length} filtered`
              : `${inflows?.length || 0} total`}{" "}
            inflow(s)
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
                        ? "No inflows match your filters."
                        : "No inflows found."}
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
                          Click {`"Record Inflow"`} to add material receipts.
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
                inflows?.length || 0
              } inflow(s) shown.`
            : `${inflows?.length || 0} inflow(s) total.`}
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
      <InflowForm
        open={formOpen}
        onOpenChange={setFormOpen}
        inflow={selectedInflow}
        mode={formMode}
      />
    </div>
  );
}
