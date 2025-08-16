/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterValues } from "@/components/filters/filter-controls";

interface UseFiltersOptions {
  defaultFilters?: FilterValues;
  syncWithUrl?: boolean;
  onFiltersChange?: (filters: FilterValues) => void;
}

export function useFilters({
  defaultFilters = {},
  syncWithUrl = true,
  onFiltersChange,
}: UseFiltersOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize with default filters only once
  const [filters, setFilters] = useState<FilterValues>(() => defaultFilters);

  // Parse filters from URL on mount
  useEffect(() => {
    if (!syncWithUrl) return;

    const urlFilters: FilterValues = {};

    // Parse search
    const search = searchParams.get("search");
    if (search) urlFilters.search = search;

    // Parse project
    const projectId = searchParams.get("project");
    if (projectId) urlFilters.projectId = projectId;

    // Parse category
    const categoryId = searchParams.get("category");
    if (categoryId) urlFilters.categoryId = categoryId;

    // Parse material
    const materialId = searchParams.get("material");
    if (materialId) urlFilters.materialId = materialId;

    // Parse status
    const status = searchParams.get("status");
    if (status) urlFilters.status = status;

    // Parse date range
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const datePreset = searchParams.get("datePreset");

    if (dateFrom || dateTo || datePreset) {
      urlFilters.dateRange = {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
        preset: datePreset || undefined,
      };
    }

    setFilters((prevFilters) => ({ ...prevFilters, ...urlFilters }));
  }, [searchParams, syncWithUrl]);

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: FilterValues) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams();

      // Add filters to URL
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.projectId) params.set("project", newFilters.projectId);
      if (newFilters.categoryId) params.set("category", newFilters.categoryId);
      if (newFilters.materialId) params.set("material", newFilters.materialId);
      if (newFilters.status) params.set("status", newFilters.status);

      if (newFilters.dateRange) {
        if (newFilters.dateRange.from) {
          params.set(
            "dateFrom",
            newFilters.dateRange.from.toISOString().split("T")[0]
          );
        }
        if (newFilters.dateRange.to) {
          params.set(
            "dateTo",
            newFilters.dateRange.to.toISOString().split("T")[0]
          );
        }
        if (newFilters.dateRange.preset) {
          params.set("datePreset", newFilters.dateRange.preset);
        }
      }

      const newUrl = params.toString() ? `?${params.toString()}` : "";
      router.replace(newUrl, { scroll: false });
    },
    [router, syncWithUrl]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
      updateUrl(newFilters);
      onFiltersChange?.(newFilters);
    },
    [updateUrl, onFiltersChange]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    updateUrl({});
    onFiltersChange?.({});
  }, [updateUrl, onFiltersChange]);

  // Get date range for API queries
  const getDateRange = useCallback(() => {
    if (!filters.dateRange) return null;

    const { preset, from, to } = filters.dateRange;

    if (preset) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (preset) {
        case "Today":
          return {
            from: today,
            to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1), // End of today
          };
        case "Week":
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return {
            from: weekStart,
            to: now,
          };
        case "Month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return {
            from: monthStart,
            to: now,
          };
        default:
          return null;
      }
    }

    return { from, to };
  }, [filters.dateRange]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "search") return value && value.length > 0;
      if (key === "dateRange")
        return value && (value.from || value.to || value.preset);
      return value && value !== "";
    });
  }, [filters]);

  // Get filter query for API calls
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, any> = {};

    if (filters.search) apiFilters.search = filters.search;
    if (filters.projectId) apiFilters.projectId = filters.projectId;
    if (filters.categoryId) apiFilters.categoryId = filters.categoryId;
    if (filters.materialId) apiFilters.materialId = filters.materialId;
    if (filters.status) apiFilters.status = filters.status;

    const dateRange = getDateRange();
    if (dateRange) {
      if (dateRange.from) apiFilters.dateFrom = dateRange.from.toISOString();
      if (dateRange.to) apiFilters.dateTo = dateRange.to.toISOString();
    }

    return apiFilters;
  }, [filters, getDateRange]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    getDateRange,
    getApiFilters,
  };
}
