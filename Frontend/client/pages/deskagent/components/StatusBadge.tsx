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
  pending_travel_desk: "Pending",
  requested: "Requested",
  booking_in_progress: "In Progress",
  booked: "Booked",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Map backend status → internal variant key
const STATUS_VARIANT_MAP: Record<string, string> = {
  pending_travel_desk: "pending",
  pending: "pending",
  requested: "requested",
  booking_in_progress: "in_progress",
  booked: "booked",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = STATUS_VARIANT_MAP[status] || "default";
  const label = STATUS_LABEL_MAP[status] || "Unknown";

  // Tailwind classes for each variant
  const variantClasses: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    pending_manager: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    pending_travel_desk: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    requested: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    in_progress: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    booking_in_progress: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    booked: "bg-yellow-500/10 text-orange-700 border-orange-500/20",
    confirmed: "bg-green-500/10 text-green-700 border-green-500/20",
    completed: "bg-green-500/10 text-green-700 border-green-500/20",
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
