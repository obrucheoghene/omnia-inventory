// src/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/db/schema";

interface CreateUserData {
  name: string;
  username: string;
  password: string;
  role: "SUPER_USER" | "EDITOR" | "VIEWER";
}

interface UpdateUserData {
  id: string;
  name?: string;
  username?: string;
  password?: string;
  role?: "SUPER_USER" | "EDITOR" | "VIEWER";
}

// Fetch all users (SUPER_USER only)
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });
}

// Fetch single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create user mutation (SUPER_USER only)
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<User> => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Update user mutation (SUPER_USER only)
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserData): Promise<User> => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", data.id] });
    },
  });
}

// Delete user mutation (SUPER_USER only)
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
