import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Material } from "@/lib/db/schema";
import { CreateMaterial, UpdateMaterial } from "@/lib/validations";

// Fetch all materials
export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async (): Promise<Material[]> => {
      const response = await fetch("/api/materials");
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      return response.json();
    },
  });
}

// Fetch single Material
export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["materials", id],
    queryFn: async (): Promise<Material> => {
      const response = await fetch(`/api/materials/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Material");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create Material mutation
export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterial): Promise<Material> => {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create Material");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

// Update Material mutation
export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMaterial): Promise<Material> => {
      const response = await fetch(`/api/materials/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update Material");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["materials", data.id] });
    },
  });
}

// Delete Material mutation
export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete Material");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}
