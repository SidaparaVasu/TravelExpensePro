import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

// Map backend status → UI-friendly label
const STATUS_LABEL_MAP: Record<string, string> = {
  pending: "Pending",
  requested: "Pending",
  in_progress: "In Progress",
  booking_in_progress: "In Progress",
  confirmed: "Booked",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Map backend status → internal variant key
const STATUS_VARIANT_MAP: Record<string, string> = {
  pending: "pending",
  requested: "pending",
  in_progress: "in_progress",
  booking_in_progress: "in_progress",
  confirmed: "confirmed",
  booked: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = STATUS_VARIANT_MAP[status] || "default";
  const label = STATUS_LABEL_MAP[status] || status;

  // Tailwind classes for each variant
  const variantClasses: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    in_progress: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    confirmed: "bg-green-500/10 text-green-700 border-green-500/20",
    completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-700 border-red-500/20",
    default: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {label}
    </Badge>
  );
};
