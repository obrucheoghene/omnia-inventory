// src/components/tables/users-table.tsx
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
  Users,
  Shield,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { User } from "@/lib/db/schema";
import UserForm from "@/components/forms/user-form";
import { formatDate } from "@/lib/utils";
import { useInventoryToast } from "@/hooks/use-inventory-toast";

export default function UsersTable() {
  const { data: session } = useSession();
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const { user: userToast } = useInventoryToast();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const handleCreate = () => {
    setSelectedUser(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = async (user: User) => {
    // Prevent self-deletion
    if (user.id === session?.user?.id) {
      userToast.error("delete", "You cannot delete your own account");
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUser.mutateAsync(user.id);
        userToast.deleted(user.username);
      } catch (error) {
        console.error("Error deleting user:", error);
        userToast.error(
          "delete",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_USER":
        return "destructive";
      case "EDITOR":
        return "default";
      case "VIEWER":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "SUPER_USER":
        return "Super User";
      case "EDITOR":
        return "Editor";
      case "VIEWER":
        return "Viewer";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_USER":
        return <ShieldCheck className="h-4 w-4" />;
      case "EDITOR":
        return <Edit className="h-4 w-4" />;
      case "VIEWER":
        return <Eye className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm">@{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <div className="flex items-center space-x-2">
            {getRoleIcon(role)}
            <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
              {getRoleDisplayName(role)}
            </Badge>
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === session?.user?.id;

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
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(user)}
                className="text-red-600"
                disabled={isCurrentUser}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isCurrentUser ? "Cannot delete self" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users || [],
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
        <div className="text-sm text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-600">
          Error loading users: {error.message}
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
            <Users className="h-6 w-6 text-blue-600" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage system users and their access permissions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {users?.filter((u) => u.role === "SUPER_USER").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Super Users</div>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {users?.filter((u) => u.role === "EDITOR").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Editors</div>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {users?.filter((u) => u.isActive).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter users..."
            value={
              (table.getColumn("username")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("username")?.setFilterValue(event.target.value)
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
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <div className="text-sm">No users found.</div>
                    <div className="text-xs mt-1">
                      Click {"Add User"} to create your first user.
                    </div>
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
          {table.getFilteredRowModel().rows.length} user(s) total.
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
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        mode={formMode}
      />
    </div>
  );
}
