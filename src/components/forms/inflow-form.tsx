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
import { Loader2, Upload, Calendar } from "lucide-react";
import { createInflowSchema, CreateInflow } from "@/lib/validations";
import {
  useCreateInflow,
  useUpdateInflow,
  useMaterialsWithUnits,
} from "@/hooks/use-inflows";
import { useProjects } from "@/hooks/use-projects";
import { useCategories } from "@/hooks/use-categories";
import { Inflow } from "@/lib/db/schema";
import { useInventoryToast } from "@/hooks/use-inventory-toast";

interface InflowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inflow?: Inflow | null;
  mode: "create" | "edit";
}

export default function InflowForm({
  open,
  onOpenChange,
  inflow,
  mode,
}: InflowFormProps) {
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  const { inflow: inflowToast } = useInventoryToast();
  const createInflow = useCreateInflow();
  const updateInflow = useUpdateInflow();
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
  } = useForm<CreateInflow>({
    resolver: zodResolver(createInflowSchema),
    defaultValues: {
      materialId: "",
      unitId: "",
      projectId: "",
      quantity: 0,
      unitPrice: 0,
      deliveryDate: "",
      receivedBy: "",
      supplierName: "",
      purpose: "",
      batchNumber: "",
      expiryDate: "",
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
      // Reset unit selection when material changes
      setValue("unitId", "");
    }
  }, [watchedMaterialId, materialsWithUnits, setValue]);

  const onSubmit = async (data: CreateInflow) => {
    try {
      setError("");

      if (mode === "create") {
        await createInflow.mutateAsync(data);
        const material = materialsWithUnits?.find(
          (m: any) => m.id === data.materialId
        );
        inflowToast.created(material.name, data.quantity);
      } else if (inflow) {
        await updateInflow.mutateAsync({ ...data, id: inflow.id });
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
      if (inflow && mode === "edit") {
        setValue("materialId", inflow.materialId);
        setValue("unitId", inflow.unitId);
        setValue("projectId", inflow.projectId);
        setValue("quantity", parseFloat(inflow.quantity));
        setValue(
          "unitPrice",
          inflow.unitPrice ? parseFloat(inflow.unitPrice) : 0
        );
        setValue(
          "deliveryDate",
          new Date(inflow.deliveryDate).toISOString().split("T")[0]
        );
        setValue("receivedBy", inflow.receivedBy);
        setValue("supplierName", inflow.supplierName);
        setValue("purpose", inflow.purpose);
        setValue("batchNumber", inflow.batchNumber || "");
        setValue(
          "expiryDate",
          inflow.expiryDate
            ? new Date(inflow.expiryDate).toISOString().split("T")[0]
            : ""
        );
      } else {
        reset({
          materialId: "",
          unitId: "",
          projectId: "",
          quantity: 0,
          unitPrice: 0,
          deliveryDate: "",
          receivedBy: "",
          supplierName: "",
          purpose: "",
          batchNumber: "",
          expiryDate: "",
          supportDocument: "",
        });
        setSelectedCategory("");
        setSelectedMaterial("");
        setAvailableUnits([]);
      }
      setError("");
    }
  }, [open, inflow, mode, reset, setValue]);

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
              ? "Record Material Inflow"
              : "Edit Material Inflow"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record materials received into the warehouse."
              : "Update the inflow information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Material Selection Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Material Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={watch("projectId")}
                  onValueChange={(value) => setValue("projectId", value)}
                >
                  <SelectTrigger className=" w-full">
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
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category (Filter)</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className=" w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All categories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Material Selection */}
              <div className="space-y-2">
                <Label htmlFor="materialId">Material *</Label>
                <Select
                  value={watch("materialId")}
                  onValueChange={(value) => setValue("materialId", value)}
                >
                  <SelectTrigger className=" w-full">
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
                  <SelectTrigger className=" w-full">
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
                  <p className="text-sm text-red-600">
                    {errors.unitId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quantity and Pricing Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Quantity & Delivery Information
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
                <Label htmlFor="quantity">Unit Price </Label>
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
                {errors.quantity && (
                  <p className="text-sm text-red-600">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Total Value </Label>
                <Input
                  placeholder="Total value"
                  value={totalValue ? totalValue : ""}
                  readOnly={true}
                  disabled={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...register("deliveryDate")}
                  disabled={isSubmitting}
                />
                {errors.deliveryDate && (
                  <p className="text-sm text-red-600">
                    {errors.deliveryDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                  id="supplierName"
                  {...register("supplierName")}
                  placeholder="Enter supplier name"
                  disabled={isSubmitting}
                />
                {errors.supplierName && (
                  <p className="text-sm text-red-600">
                    {errors.supplierName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedBy">Received By *</Label>
                <Input
                  id="receivedBy"
                  {...register("receivedBy")}
                  placeholder="Warehouse keeper name"
                  disabled={isSubmitting}
                />
                {errors.receivedBy && (
                  <p className="text-sm text-red-600">
                    {errors.receivedBy.message}
                  </p>
                )}
              </div>
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
                placeholder="Describe the purpose of this material inflow"
                disabled={isSubmitting}
                rows={3}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
                <Input
                  id="batchNumber"
                  {...register("batchNumber")}
                  placeholder="Enter batch number"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register("expiryDate")}
                  disabled={isSubmitting}
                />
              </div>
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
              {mode === "create" ? "Record Inflow" : "Update Inflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
