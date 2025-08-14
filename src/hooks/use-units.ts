import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Unit } from "@/lib/db/schema";
import { CreateUnit, UpdateUnit } from "@/lib/validations";

// Fetch all units
export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async (): Promise<Unit[]> => {
      const response = await fetch("/api/units");
      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }
      return response.json();
    },
  });
}

// Fetch single Unit
export function useUnit(id: string) {
  return useQuery({
    queryKey: ["units", id],
    queryFn: async (): Promise<Unit> => {
      const response = await fetch(`/api/units/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Unit");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create Unit mutation
export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUnit): Promise<Unit> => {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create Unit");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

// Update Unit mutation
export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUnit): Promise<Unit> => {
      const response = await fetch(`/api/units/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update Unit");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", data.id] });
    },
  });
}

// Delete Unit mutation
export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete Unit");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}
