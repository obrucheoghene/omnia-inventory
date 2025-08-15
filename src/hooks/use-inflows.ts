import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inflow } from "@/lib/db/schema";
import { CreateInflow, UpdateInflow } from "@/lib/validations";

// Fetch all inflows with pagination
export function useInflows(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["inflows", page, limit],
    queryFn: async (): Promise<Inflow[]> => {
      const response = await fetch(`/api/inflows?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inflows");
      }
      return response.json();
    },
  });
}

// Fetch single inflow
export function useInflow(id: string) {
  return useQuery({
    queryKey: ["inflows", id],
    queryFn: async (): Promise<Inflow> => {
      const response = await fetch(`/api/inflows/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inflow");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create inflow mutation
export function useCreateInflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInflow): Promise<Inflow> => {
      const response = await fetch("/api/inflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create inflow");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inflows"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Update inflow mutation
export function useUpdateInflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInflow): Promise<Inflow> => {
      const response = await fetch(`/api/inflows/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update inflow");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inflows"] });
      queryClient.invalidateQueries({ queryKey: ["inflows", data.id] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Delete inflow mutation
export function useDeleteInflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/inflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete inflow");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inflows"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Fetch materials with units for form dropdowns
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
