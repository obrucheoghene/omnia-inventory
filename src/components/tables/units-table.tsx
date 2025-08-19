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
  Ruler,
} from "lucide-react";
import { useUnits, useDeleteUnit } from "@/hooks/use-units";
import { Unit } from "@/lib/db/schema";
import { canManageInventory } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";
import UnitForm from "@/components/forms/unit-form";
import { formatDate } from "@/lib/utils";
import { useInventoryToast } from "@/hooks/use-inventory-toast";

export default function UnitsTable() {
  const { data: session } = useSession();
  const { data: units, isLoading, error } = useUnits();
  const deleteUnit = useDeleteUnit();

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const canEdit = canManageInventory(session?.user?.role as UserRole);
  const { unit: unitToast } = useInventoryToast();

  const handleCreate = () => {
    setSelectedUnit(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (
      confirm(
        "Are you sure you want to delete this unit? This will also affect any materials using this unit."
      )
    ) {
      try {
        await deleteUnit.mutateAsync(unit.id);
        unitToast.deleted(unit.name);
      } catch (error) {
        if (error instanceof Error) unitToast.error("delete", error.message);
        console.error("Error deleting unit:", error);
      }
    }
  };

  // Column definitions
  const columns: ColumnDef<Unit>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Unit Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Ruler className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "abbreviation",
      header: "Abbreviation",
      cell: ({ row }) => {
        const abbreviation = row.getValue("abbreviation") as string | null;
        return (
          <div className="text-sm">
            {abbreviation ? (
              <Badge variant="outline" className="font-mono">
                {abbreviation}
              </Badge>
            ) : (
              <span className="text-muted-foreground italic">
                No abbreviation
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-[300px]">
            {description ? (
              <span className="text-sm text-muted-foreground">
                {description.length > 50
                  ? `${description.substring(0, 50)}...`
                  : description}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                No description
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div className="text-sm">{formatDate(date)}</div>;
      },
    },
  ];

  // Add actions column if user can edit
  if (canEdit) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const unit = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(unit)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(unit)}
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
    data: units || [],
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
        <div className="text-sm text-muted-foreground">Loading units...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-600">
          Error loading units: {error.message}
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
            <Ruler className="h-6 w-6 text-purple-600" />
            Units of Measurement
          </h2>
          <p className="text-muted-foreground">
            Manage measurement units for your materials (kg, meters, pieces,
            etc.)
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter units..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
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
                    <Ruler className="h-12 w-12 mb-4 opacity-50" />
                    <div className="text-sm">No units found.</div>
                    {canEdit && (
                      <div className="text-xs mt-1">
                        Click {`"Add Unit"`} to create your first measurement
                        unit.
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
          {table.getFilteredRowModel().rows.length} unit(s) total.
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
      <UnitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        unit={selectedUnit}
        mode={formMode}
      />
    </div>
  );
}
