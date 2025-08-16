/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { createOutflowSchema, CreateOutflow } from "@/lib/validations";
import {
  useCreateOutflow,
  useUpdateOutflow,
  useMaterialsWithUnits,
} from "@/hooks/use-outflows";
import { useProjects } from "@/hooks/use-projects";
import { useCategories } from "@/hooks/use-categories";
import { Outflow } from "@/lib/db/schema";

interface OutflowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outflow?: Outflow | null;
  mode: "create" | "edit";
}

export default function OutflowForm({
  open,
  onOpenChange,
  outflow,
  mode,
}: OutflowFormProps) {
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [stockWarning, setStockWarning] = useState<string>("");

  const createOutflow = useCreateOutflow();
  const updateOutflow = useUpdateOutflow();
  const { data: projects } = useProjects();
  const { data: categories } = useCategories();
  const { data: materialsWithUnits } = useMaterialsWithUnits();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOutflow>({
    resolver: zodResolver(createOutflowSchema),
    defaultValues: {
      materialId: "",
      unitId: "",
      projectId: "",
      quantity: 0,
      unitPrice: undefined,
      releaseDate: "",
      authorizedBy: "",
      receivedBy: "",
      purpose: "",
      returnDate: "",
      supportDocument: "",
    },
  });

  const watchedMaterialId = watch("materialId");
  const watchedQuantity = watch("quantity");
  const watchedUnitPrice = watch("unitPrice");

  // Filter materials by selected category
  const filteredMaterials =
    materialsWithUnits?.filter(
      (material: any) =>
        !selectedCategory || material.categoryId === selectedCategory
    ) || [];

  // Update available units when material changes
  useEffect(() => {
    if (watchedMaterialId) {
      const material = materialsWithUnits?.find(
        (m: any) => m.id === watchedMaterialId
      );
      setAvailableUnits(material?.units || []);
      setSelectedMaterial(watchedMaterialId);
      setValue("unitId", "");
    }
  }, [watchedMaterialId, materialsWithUnits, setValue]);

  // Check stock levels when quantity or material/unit changes
  useEffect(() => {
    if (watchedMaterialId && watchedQuantity > 0) {
      // TODO: Add API call to check current stock
      // For now, show a general warning
      if (watchedQuantity > 100) {
        setStockWarning(
          "High quantity requested. Please verify stock availability."
        );
      } else {
        setStockWarning("");
      }
    } else {
      setStockWarning("");
    }
  }, [watchedMaterialId, watchedQuantity]);

  const onSubmit = async (data: CreateOutflow) => {
    try {
      setError("");

      if (mode === "create") {
        await createOutflow.mutateAsync(data);
      } else if (outflow) {
        await updateOutflow.mutateAsync({ ...data, id: outflow.id });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (outflow && mode === "edit") {
        setValue("materialId", outflow.materialId);
        setValue("unitId", outflow.unitId);
        setValue("projectId", outflow.projectId);
        setValue("quantity", parseFloat(outflow.quantity));
        setValue(
          "unitPrice",
          outflow.unitPrice ? parseFloat(outflow.unitPrice) : undefined
        );
        setValue(
          "releaseDate",
          new Date(outflow.releaseDate).toISOString().split("T")[0]
        );
        setValue("authorizedBy", outflow.authorizedBy);
        setValue("receivedBy", outflow.receivedBy);
        setValue("purpose", outflow.purpose);
        setValue(
          "returnDate",
          outflow.returnDate
            ? new Date(outflow.returnDate).toISOString().split("T")[0]
            : ""
        );
      } else {
        reset({
          materialId: "",
          unitId: "",
          projectId: "",
          quantity: 0,
          unitPrice: undefined,
          releaseDate: "",
          authorizedBy: "",
          receivedBy: "",
          purpose: "",
          returnDate: "",
          supportDocument: "",
        });
        setSelectedCategory("");
        setSelectedMaterial("");
        setAvailableUnits([]);
      }
      setError("");
      setStockWarning("");
    }
  }, [open, outflow, mode, reset, setValue]);

  // Calculate total value
  const totalValue =
    watchedQuantity && watchedUnitPrice
      ? watchedQuantity * watchedUnitPrice
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Record Material Outflow"
              : "Edit Material Outflow"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record materials distributed from the warehouse."
              : "Update the outflow information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Material Selection Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Material Information
            </h4>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (Filter)</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Material Selection */}
            <div className="space-y-2">
              <Label htmlFor="materialId">Material *</Label>
              <Select
                value={watch("materialId")}
                onValueChange={(value) => setValue("materialId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMaterials.map((material: any) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.categoryName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.materialId && (
                <p className="text-sm text-red-600">
                  {errors.materialId.message}
                </p>
              )}
            </div>

            {/* Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit *</Label>
              <Select
                value={watch("unitId")}
                onValueChange={(value) => setValue("unitId", value)}
                disabled={!selectedMaterial}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation}){" "}
                      {unit.isPrimary && "(Primary)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && (
                <p className="text-sm text-red-600">{errors.unitId.message}</p>
              )}
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select
                value={watch("projectId")}
                onValueChange={(value) => setValue("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-600">
                  {errors.projectId.message}
                </p>
              )}
            </div>
          </div>

          {/* Quantity and Pricing Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Quantity & Pricing
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("quantity", {
                    valueAsNumber: true,
                    required: "Quantity is required",
                  })}
                  placeholder="Enter quantity"
                  disabled={isSubmitting}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (Optional)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("unitPrice", {
                    valueAsNumber: true,
                  })}
                  placeholder="Enter unit price"
                  disabled={isSubmitting}
                />
                {errors.unitPrice && (
                  <p className="text-sm text-red-600">
                    {errors.unitPrice.message}
                  </p>
                )}
              </div>
            </div>

            {stockWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{stockWarning}</AlertDescription>
              </Alert>
            )}

            {totalValue > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  Total Value:{" "}
                  <span className="text-blue-600">
                    ${totalValue.toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Release Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Release Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="releaseDate">Release Date *</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  {...register("releaseDate")}
                  disabled={isSubmitting}
                />
                {errors.releaseDate && (
                  <p className="text-sm text-red-600">
                    {errors.releaseDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorizedBy">Authorized By *</Label>
                <Input
                  id="authorizedBy"
                  {...register("authorizedBy")}
                  placeholder="Person who authorized release"
                  disabled={isSubmitting}
                />
                {errors.authorizedBy && (
                  <p className="text-sm text-red-600">
                    {errors.authorizedBy.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By *</Label>
              <Input
                id="receivedBy"
                {...register("receivedBy")}
                placeholder="Person who received the materials"
                disabled={isSubmitting}
              />
              {errors.receivedBy && (
                <p className="text-sm text-red-600">
                  {errors.receivedBy.message}
                </p>
              )}
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Additional Information
            </h4>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Textarea
                id="purpose"
                {...register("purpose")}
                placeholder="Describe the purpose of this material outflow"
                disabled={isSubmitting}
                rows={3}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">
                Expected Return Date (Optional)
              </Label>
              <Input
                id="returnDate"
                type="date"
                {...register("returnDate")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Set if materials are expected to be returned
              </p>
            </div>

            {/* File Upload Section (placeholder) */}
            <div className="space-y-2">
              <Label htmlFor="supportDocument">
                Support Document (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, or image files up to 10MB
                </p>
              </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Record Outflow" : "Update Outflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
