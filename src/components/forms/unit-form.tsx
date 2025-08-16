"use client";

import React, { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { createUnitSchema, CreateUnit } from "@/lib/validations";
import { useCreateUnit, useUpdateUnit } from "@/hooks/use-units";
import { Unit } from "@/lib/db/schema";

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  mode: "create" | "edit";
}

export default function UnitForm({
  open,
  onOpenChange,
  unit,
  mode,
}: UnitFormProps) {
  const [error, setError] = useState("");

  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUnit>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: unit
      ? {
          name: unit.name,
          abbreviation: unit.abbreviation || "",
          description: unit.description || "",
        }
      : {
          name: "",
          abbreviation: "",
          description: "",
        },
  });

  const onSubmit = async (data: CreateUnit) => {
    try {
      setError("");

      if (mode === "create") {
        await createUnit.mutateAsync(data);
      } else if (unit) {
        await updateUnit.mutateAsync({ ...data, id: unit.id });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Reset form when unit changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (unit && mode === "edit") {
        reset({
          name: unit.name,
          abbreviation: unit.abbreviation || "",
          description: unit.description || "",
        });
      } else {
        reset({
          name: "",
          abbreviation: "",
          description: "",
        });
      }
      setError("");
    }
  }, [open, unit, mode, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Unit" : "Edit Unit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new measurement unit to the system."
              : "Update the unit information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter unit name (e.g., Kilograms, Meters, Pieces)"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abbreviation (Optional)</Label>
            <Input
              id="abbreviation"
              {...register("abbreviation")}
              placeholder="Enter abbreviation (e.g., kg, m, pcs)"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Short form of the unit name for display purposes
            </p>
            {errors.abbreviation && (
              <p className="text-sm text-red-600">
                {errors.abbreviation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter unit description or additional notes"
              disabled={isSubmitting}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Examples Section */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Common Units Examples:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p>
                  <strong>Weight:</strong> kg, tons, lbs
                </p>
                <p>
                  <strong>Length:</strong> m, cm, ft, in
                </p>
                <p>
                  <strong>Area:</strong> m², ft², sq m
                </p>
              </div>
              <div>
                <p>
                  <strong>Volume:</strong> L, gal, m³
                </p>
                <p>
                  <strong>Count:</strong> pcs, bags, rolls
                </p>
                <p>
                  <strong>Other:</strong> boxes, sheets
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
              {mode === "create" ? "Create Unit" : "Update Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
