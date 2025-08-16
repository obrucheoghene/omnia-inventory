"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  TrendingDown,
  Package,
} from "lucide-react";
import { useOutflows, useDeleteOutflow } from "@/hooks/use-outflows";
import { Outflow } from "@/lib/db/schema";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import OutflowForm from "@/components/forms/outflow-form";
import { formatDate } from "@/lib/utils";

export default function OutflowsTable() {
  const { data: session } = useSession();
  const { data: outflows, isLoading, error } = useOutflows();
  const deleteOutflow = useDeleteOutflow();

  const [selectedOutflow, setSelectedOutflow] = useState<Outflow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const canEdit = canManageInventory(session?.user?.role as UserRole);

  const handleCreate = () => {
    setSelectedOutflow(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (outflow: Outflow) => {
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

  // Column definitions
  const columns: ColumnDef<Outflow>[] = [
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
          <span className="font-medium">{row.getValue("materialName")}</span>
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
          return (
            <Badge variant={isReturned ? "default" : "secondary"}>
              {isReturned ? "Returned" : "Pending Return"}
            </Badge>
          );
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
    data: outflows || [],
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
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Record Outflow
          </Button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter by material..."
            value={
              (table.getColumn("materialName")?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn("materialName")
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Filter by authorized person..."
            value={
              (table.getColumn("authorizedBy")?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn("authorizedBy")
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
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
                    <div className="text-sm">No outflow found.</div>
                    {canEdit && (
                      <div className="text-xs mt-1">
                        Click ${`"Record Outflow"`} to add material
                        distributions
                      </div>
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
          {table.getFilteredRowModel().rows.length} outflow(s) total.
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
