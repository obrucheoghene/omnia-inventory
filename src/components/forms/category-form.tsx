"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { createCategorySchema, CreateCategory } from "@/lib/validations";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { Category } from "@/lib/db/schema";
import { useInventoryToast } from "@/hooks/use-inventory-toast";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  mode: "create" | "edit";
}

export default function CategoryForm({
  open,
  onOpenChange,
  category,
  mode,
}: CategoryFormProps) {
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const { category: categoryToast } = useInventoryToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategory>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description || "",
        }
      : {
          name: "",
          description: "",
        },
  });

  useEffect(() => {
    if (category) {
      setValue("name", category.name);
      if (category.description) setValue("description", category.description);
    } else {
      reset();
    }
  }, [category, reset, setValue]);

  const onSubmit = async (data: CreateCategory) => {
    try {
      setError("");

      if (mode === "create") {
        await createCategory.mutateAsync(data);
        categoryToast.created(data.name);
      } else if (category) {
        await updateCategory.mutateAsync({ ...data, id: category.id, isActive });
        categoryToast.updated(data.name);
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Reset form when category changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (category && mode === "edit") {
        reset({ name: category.name, description: category.description || "" });
        setIsActive(category.isActive ?? true);
      } else {
        reset({ name: "", description: "" });
        setIsActive(true);
      }
      setError("");
    }
  }, [open, category, mode, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Category" : "Edit Category"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new material category to organize your inventory."
              : "Update the category information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter category name (e.g., Cement & Concrete)"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter category description (e.g., All cement and concrete related materials)"
              disabled={isSubmitting}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {mode === "edit" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? "Category is active and available" : "Category is inactive and hidden"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

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
              {mode === "create" ? "Create Category" : "Update Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
