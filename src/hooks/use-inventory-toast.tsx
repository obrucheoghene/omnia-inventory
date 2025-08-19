"use client";

import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  Boxes,
  Ruler,
} from "lucide-react";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useInventoryToast() {
  // Generic toast functions
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      icon: <XCircle className="h-4 w-4" />,
      description: options?.description,
      duration: options?.duration || 8000,
      action: options?.action,
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      icon: <AlertTriangle className="h-4 w-4" />,
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, {
      icon: <Info className="h-4 w-4" />,
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  };

  // Material-specific toasts
  const material = {
    created: (name: string) =>
      showSuccess("Material Created", {
        description: `${name} has been added to the inventory`,
      }),
    updated: (name: string) =>
      showSuccess("Material Updated", {
        description: `${name} has been successfully updated`,
      }),
    deleted: (name: string) =>
      showSuccess("Material Deleted", {
        description: `${name} has been removed from inventory`,
      }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Material`, {
        description: error || "Please try again",
      }),
  };

  // Inflow-specific toasts
  const inflow = {
    created: (materialName: string, quantity: number) => {
      toast.success("Inflow Recorded", {
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        description: `+${quantity} ${materialName} added to inventory`,
        duration: 4000,
      });
    },
    updated: (materialName: string) =>
      showSuccess("Inflow Updated", {
        description: `${materialName} inflow record updated`,
      }),
    deleted: () =>
      showSuccess("Inflow Deleted", {
        description: "Inflow record has been removed",
      }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Inflow`, {
        description: error || "Please check your data and try again",
      }),
  };

  // Outflow-specific toasts
  const outflow = {
    created: (materialName: string, quantity: number) => {
      toast.success("Outflow Recorded", {
        icon: <TrendingDown className="h-4 w-4 text-red-600" />,
        description: `-${quantity} ${materialName} released from inventory`,
        duration: 4000,
      });
    },
    updated: (materialName: string) =>
      showSuccess("Outflow Updated", {
        description: `${materialName} outflow record updated`,
      }),
    deleted: () =>
      showSuccess("Outflow Deleted", {
        description: "Outflow record has been removed",
      }),
    insufficientStock: (
      materialName: string,
      available: number,
      requested: number
    ) => {
      toast.error("Insufficient Stock", {
        icon: <AlertTriangle className="h-4 w-4" />,
        description: `Only ${available} ${materialName} available, but ${requested} requested`,
        duration: 8000,
      });
    },
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Outflow`, {
        description: error || "Please check stock levels and try again",
      }),
  };

  // User-specific toasts
  const user = {
    created: (username: string) => {
      toast.success("User Created", {
        icon: <Users className="h-4 w-4" />,
        description: `User ${username} has been created successfully`,
        duration: 4000,
      });
    },
    updated: (username: string) =>
      showSuccess("User Updated", {
        description: `${username}'s account has been updated`,
      }),
    deleted: (username: string) =>
      showSuccess("User Deleted", {
        description: `${username} has been removed from the system`,
      }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} User`, {
        description: error || "Please try again",
      }),
  };

  // Project-specific toasts
  const project = {
    created: (name: string) => {
      toast.success("Project Created", {
        icon: <FolderOpen className="h-4 w-4" />,
        description: `${name} project has been created`,
        duration: 4000,
      });
    },
    updated: (name: string) =>
      showSuccess("Project Updated", {
        description: `${name} has been successfully updated`,
      }),
    deleted: (name: string) =>
      showSuccess("Project Deleted", {
        description: `${name} has been removed`,
      }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Project`, {
        description: error || "Please try again",
      }),
  };

  // Category-specific toasts
  const category = {
    created: (name: string) => {
      toast.success("Category Created", {
        icon: <Boxes className="h-4 w-4" />,
        description: `${name} category has been added`,
        duration: 4000,
      });
    },
    updated: (name: string) =>
      showSuccess("Category Updated", {
        description: `${name} has been successfully updated`,
      }),
    deleted: (name: string) =>
      showSuccess("Category Deleted", {
        description: `${name} has been removed`,
      }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Category`, {
        description: error || "Please try again",
      }),
  };

  // Unit-specific toasts
  const unit = {
    created: (name: string) => {
      toast.success("Unit Created", {
        icon: <Ruler className="h-4 w-4" />,
        description: `${name} unit has been added`,
        duration: 4000,
      });
    },
    updated: (name: string) =>
      showSuccess("Unit Updated", {
        description: `${name} has been successfully updated`,
      }),
    deleted: (name: string) =>
      showSuccess("Unit Deleted", { description: `${name} has been removed` }),
    error: (action: string, error?: string) =>
      showError(`Failed to ${action} Unit`, {
        description: error || "Please try again",
      }),
  };

  // System notifications
  const system = {
    lowStock: (
      materialName: string,
      currentStock: number,
      minLevel: number
    ) => {
      toast.warning("Low Stock Alert", {
        icon: <AlertTriangle className="h-4 w-4" />,
        description: `${materialName} is running low: ${currentStock} remaining (min: ${minLevel})`,
        duration: 10000,
        action: {
          label: "View Details",
          onClick: () => console.log("Navigate to material details"),
        },
      });
    },
    outOfStock: (materialName: string) => {
      toast.error("Out of Stock", {
        icon: <AlertTriangle className="h-4 w-4" />,
        description: `${materialName} is completely out of stock`,
        duration: 0, // Persistent until dismissed
        action: {
          label: "Reorder",
          onClick: () => console.log("Navigate to reorder"),
        },
      });
    },
    dataSync: () => {
      toast.success("Data Synchronized", {
        description: "All inventory data has been synchronized",
        duration: 3000,
      });
    },
    exportComplete: (type: string) => {
      toast.success("Export Complete", {
        description: `${type} data has been exported successfully`,
        duration: 4000,
      });
    },
  };

  // Bulk operations
  const bulk = {
    success: (action: string, count: number) => {
      toast.success(`Bulk ${action} Complete`, {
        description: `${count} items ${action.toLowerCase()} successfully`,
        duration: 4000,
      });
    },
    error: (action: string, failed: number, total: number) => {
      toast.error(`Bulk ${action} Failed`, {
        description: `${failed} of ${total} items failed to ${action.toLowerCase()}`,
        duration: 8000,
      });
    },
  };

  return {
    // Generic functions
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Specific entity functions
    material,
    inflow,
    outflow,
    user,
    project,
    category,
    unit,
    system,
    bulk,

    // Direct access to toast for custom usage
    toast,
  };
}
