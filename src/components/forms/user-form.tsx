// src/components/forms/user-form.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { User } from "@/lib/db/schema";
import { useInventoryToast } from "@/hooks/use-inventory-toast";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username too long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255, "Password too long"),
  role: z.enum(["SUPER_USER", "EDITOR", "VIEWER"], {
    // required_error: "Please select a role",
  }),
});

const updateUserSchema = createUserSchema.partial().extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255, "Password too long")
    .optional()
    .or(z.literal("")),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type UpdateUserData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: "create" | "edit";
}

export default function UserForm({
  open,
  onOpenChange,
  user,
  mode,
}: UserFormProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { user: userToast } = useInventoryToast();

  const form = useForm<CreateUserData | UpdateUserData>({
    resolver: zodResolver(
      mode === "create" ? createUserSchema : updateUserSchema
    ),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "VIEWER",
    },
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && user) {
        form.reset({
          name: user.name,
          username: user.username,
          password: "",
          role: user.role as "SUPER_USER" | "EDITOR" | "VIEWER",
        });
      } else {
        form.reset({
          name: "",
          username: "",
          password: "",
          role: "VIEWER",
        });
      }
    }
  }, [open, mode, user, form]);

  const onSubmit = async (data: CreateUserData | UpdateUserData) => {
    try {
      if (mode === "create") {
        await createUser.mutateAsync(data as CreateUserData);
        userToast.created(data.username!);
      } else if (mode === "edit" && user) {
        // Filter out empty password for updates
        const updateData = { ...data };
        if (!updateData.password || updateData.password === "") {
          delete updateData.password;
        }

        await updateUser.mutateAsync({
          id: user.id,
          ...updateData,
        });
        userToast.updated(data.username || user.username);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving user:", error);
      userToast.error(
        mode === "create" ? "create" : "update",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <>
                <UserPlus className="h-5 w-5" />
                Create New User
              </>
            ) : (
              <>
                <UserCheck className="h-5 w-5" />
                Edit User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new user to the system with appropriate permissions."
              : "Update user information and permissions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter username"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Username can only contain letters, numbers, and underscores.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password
                    {mode === "edit" && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (leave empty to keep current password)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        mode === "create"
                          ? "Enter password"
                          : "Enter new password"
                      }
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center space-x-2">
                          <span>Viewer</span>
                          <span className="text-xs text-muted-foreground">
                            - Read-only access
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="EDITOR">
                        <div className="flex items-center space-x-2">
                          <span>Editor</span>
                          <span className="text-xs text-muted-foreground">
                            - Can manage inventory
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SUPER_USER">
                        <div className="flex items-center space-x-2">
                          <span>Super User</span>
                          <span className="text-xs text-muted-foreground">
                            - Full system access
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "VIEWER" &&
                      "Can view all data but cannot make changes."}
                    {field.value === "EDITOR" &&
                      "Can manage inventory, materials, and projects."}
                    {field.value === "SUPER_USER" &&
                      "Can manage users and has full system access."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create User" : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
