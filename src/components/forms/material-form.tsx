"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { createMaterialSchema, CreateMaterial } from "@/lib/validations";
import { useCreateMaterial, useUpdateMaterial } from "@/hooks/use-materials";
import { useCategories } from "@/hooks/use-categories";
import { useUnits } from "@/hooks/use-units";
import { Material } from "@/lib/db/schema";

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  mode: "create" | "edit";
}

export default function MaterialForm({
  open,
  onOpenChange,
  material,
  mode,
}: MaterialFormProps) {
  const [error, setError] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const { data: categories } = useCategories();
  const { data: units } = useUnits();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterial>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      minStockLevel: 0,
      unitIds: [],
    },
  });

  const watchedCategoryId = watch("categoryId");

  const onSubmit = async (data: CreateMaterial) => {
    try {
      setError("");

      // Add selected units to form data
      const formData = {
        ...data,
        unitIds: selectedUnits,
      };

      if (mode === "create") {
        await createMaterial.mutateAsync(formData);
      } else if (material) {
        await updateMaterial.mutateAsync({ ...formData, id: material.id });
      }

      reset();
      setSelectedUnits([]);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId]
    );
  };

  const removeUnit = (unitId: string) => {
    setSelectedUnits((prev) => prev.filter((id) => id !== unitId));
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (material && mode === "edit") {
        reset({
          name: material.name,
          description: material.description || "",
          categoryId: material.categoryId,
          minStockLevel: material.minStockLevel
            ? parseFloat(material.minStockLevel)
            : 0,
          unitIds: [],
        });
        // TODO: Load existing unit relationships for edit mode
        setSelectedUnits([]);
      } else {
        reset({
          name: "",
          description: "",
          categoryId: "",
          minStockLevel: 0,
          unitIds: [],
        });
        setSelectedUnits([]);
      }
      setError("");
    }
  }, [open, material, mode, reset]);

  const getUnitName = (unitId: string) => {
    const unit = units?.find((u) => u.id === unitId);
    return unit
      ? `${unit.name} (${unit.abbreviation || "N/A"})`
      : "Unknown Unit";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Material" : "Edit Material"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new material to your inventory system."
              : "Update the material information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Basic Information
            </h4>

            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter material name (e.g., Portland Cement)"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(value) => setValue("categoryId", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter material description"
                disabled={isSubmitting}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Units Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Measurement Units *
            </h4>
            <p className="text-xs text-muted-foreground">
              Select the units this material can be measured in. The first unit
              selected will be the primary unit.
            </p>

            {/* Selected Units */}
            {selectedUnits.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Units:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUnits.map((unitId, index) => (
                    <Badge key={unitId} variant="default" className="gap-1">
                      {getUnitName(unitId)}
                      {index === 0 && (
                        <span className="text-xs">(Primary)</span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeUnit(unitId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Units */}
            <div className="space-y-2">
              <Label>Available Units:</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {units
                  ?.filter((unit) => !selectedUnits.includes(unit.id))
                  .map((unit) => (
                    <Button
                      key={unit.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => handleUnitToggle(unit.id)}
                    >
                      <Plus className="h-3 w-3" />
                      {unit.name} ({unit.abbreviation || "N/A"})
                    </Button>
                  ))}
              </div>
            </div>

            {selectedUnits.length === 0 && (
              <p className="text-sm text-red-600">
                Please select at least one unit
              </p>
            )}
          </div>

          {/* Stock Management */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Stock Management
            </h4>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">
                Minimum Stock Level (Optional)
              </Label>
              <Input
                id="minStockLevel"
                type="number"
                step="0.01"
                min="0"
                {...register("minStockLevel", {
                  valueAsNumber: true,
                })}
                placeholder="Enter minimum stock level"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Set a minimum stock level to receive low stock alerts
              </p>
              {errors.minStockLevel && (
                <p className="text-sm text-red-600">
                  {errors.minStockLevel.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedUnits.length === 0}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Create Material" : "Update Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
