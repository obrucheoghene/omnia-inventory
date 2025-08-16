/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  X,
  Search,
  Calendar,
  Building2,
  Package,
  Tag,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useCategories } from "@/hooks/use-categories";
import { useMaterials } from "@/hooks/use-materials";

export interface FilterValues {
  search?: string;
  projectId?: string;
  categoryId?: string;
  materialId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
    preset?: string;
  };
  status?: string;
}

interface FilterControlsProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  availableFilters?: {
    search?: boolean;
    project?: boolean;
    category?: boolean;
    material?: boolean;
    dateRange?: boolean;
    status?: boolean;
  };
  statusOptions?: Array<{ value: string; label: string }>;
  className?: string;
}

const DEFAULT_AVAILABLE_FILTERS = {
  search: true,
  project: true,
  category: true,
  material: true,
  dateRange: true,
  status: false,
};

export default function FilterControls({
  filters,
  onFiltersChange,
  onClearFilters,
  availableFilters = DEFAULT_AVAILABLE_FILTERS,
  statusOptions = [],
  className,
}: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const { data: projects } = useProjects();
  const { data: categories } = useCategories();
  const { data: materials } = useMaterials();

  // Filter materials by selected category
  const filteredMaterials = materials?.filter(
    (material) =>
      !localFilters.categoryId ||
      material.categoryId === localFilters.categoryId
  );

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search") return value && value.length > 0;
    if (key === "dateRange") return value && (value.from || value.to);
    return value && value !== "";
  }).length;

  const updateFilter = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...localFilters, [key]: value };

    // Clear material filter when category changes
    if (key === "categoryId") {
      newFilters.materialId = undefined;
    }

    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onClearFilters();
    setIsOpen(false);
  };

  // Sync with external filter changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input - Always visible if enabled */}
        {availableFilters.search && (
          <div className="relative min-w-[200px] max-w-[300px] flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials, suppliers..."
              value={localFilters.search || ""}
              onChange={(e) => {
                updateFilter("search", e.target.value);
                // Apply search immediately
                onFiltersChange({ ...localFilters, search: e.target.value });
              }}
              className="pl-10"
            />
          </div>
        )}

        {/* Quick Filter Dropdowns */}
        {availableFilters.project && (
          <Select
            value={localFilters.projectId || "all"}
            onValueChange={(value) => {
              const projectId = value === "all" ? undefined : value;
              updateFilter("projectId", projectId);
              onFiltersChange({
                ...localFilters,
                projectId: projectId,
              });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="All Projects" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {availableFilters.category && (
          <Select
            value={localFilters.categoryId || "all"}
            onValueChange={(value) => {
              const categoryId = value === "all" ? undefined : value;
              updateFilter("categoryId", categoryId);
              onFiltersChange({
                ...localFilters,
                categoryId: categoryId,
                materialId: undefined,
              });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Advanced Filters Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  Advanced Filters
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Material Filter */}
                {availableFilters.material && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4" />
                      Material
                    </Label>
                    <Select
                      value={localFilters.materialId || "all"}
                      onValueChange={(value) => {
                        const materialId = value === "all" ? undefined : value;
                        updateFilter("materialId", materialId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Materials" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {filteredMaterials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range Filter */}
                {availableFilters.dateRange && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Date Range
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Today", "Week", "Month"].map((preset) => (
                        <Button
                          key={preset}
                          variant={
                            localFilters.dateRange?.preset === preset
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => updateFilter("dateRange", { preset })}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          From
                        </Label>
                        <Input
                          type="date"
                          value={
                            localFilters.dateRange?.from
                              ?.toISOString()
                              .split("T")[0] || ""
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            updateFilter("dateRange", {
                              ...localFilters.dateRange,
                              from: date,
                              preset: undefined,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          To
                        </Label>
                        <Input
                          type="date"
                          value={
                            localFilters.dateRange?.to
                              ?.toISOString()
                              .split("T")[0] || ""
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            updateFilter("dateRange", {
                              ...localFilters.dateRange,
                              to: date,
                              preset: undefined,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                {availableFilters.status && statusOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={localFilters.status || "all"}
                      onValueChange={(value) => {
                        const status = value === "all" ? undefined : value;
                        updateFilter("status", status);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.projectId && (
            <Badge variant="secondary" className="gap-1">
              Project: {projects?.find((p) => p.id === filters.projectId)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({ ...filters, projectId: undefined })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.categoryId && (
            <Badge variant="secondary" className="gap-1">
              Category:{" "}
              {categories?.find((c) => c.id === filters.categoryId)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    categoryId: undefined,
                    materialId: undefined,
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.materialId && (
            <Badge variant="secondary" className="gap-1">
              Material:{" "}
              {materials?.find((m) => m.id === filters.materialId)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({ ...filters, materialId: undefined })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateRange &&
            (filters.dateRange.from ||
              filters.dateRange.to ||
              filters.dateRange.preset) && (
              <Badge variant="secondary" className="gap-1">
                Date:{" "}
                {filters.dateRange.preset ||
                  `${filters.dateRange.from?.toLocaleDateString()} - ${filters.dateRange.to?.toLocaleDateString()}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() =>
                    onFiltersChange({ ...filters, dateRange: undefined })
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
        </div>
      )}
    </div>
  );
}
