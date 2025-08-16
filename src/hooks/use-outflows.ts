import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Outflow, OutflowWithJoins } from "@/lib/db/schema";
import { CreateOutflow, UpdateOutflow } from "@/lib/validations";

// Fetch all outflows with pagination
export function useOutflows(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["outflows", page, limit],
    queryFn: async (): Promise<OutflowWithJoins[]> => {
      const response = await fetch(`/api/outflows?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch outflows");
      }
      return response.json();
    },
  });
}

// Fetch single outflow
export function useOutflow(id: string) {
  return useQuery({
    queryKey: ["outflows", id],
    queryFn: async (): Promise<Outflow> => {
      const response = await fetch(`/api/outflows/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch outflow");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create outflow mutation
export function useCreateOutflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOutflow): Promise<Outflow> => {
      const response = await fetch("/api/outflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create outflow");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Update outflow mutation
export function useUpdateOutflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOutflow): Promise<Outflow> => {
      const response = await fetch(`/api/outflows/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update outflow");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows", data.id] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Delete outflow mutation
export function useDeleteOutflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/outflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete outflow");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Fetch materials with units for form dropdowns (reuse from inflows)
export function useMaterialsWithUnits() {
  return useQuery({
    queryKey: ["materials-with-units"],
    queryFn: async () => {
      const response = await fetch("/api/materials/with-units");
      if (!response.ok) {
        throw new Error("Failed to fetch materials with units");
      }
      return response.json();
    },
  });
}
