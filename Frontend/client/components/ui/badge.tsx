import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // destructive:
        //   "border-transparent bg-red-600 text-destructive-foreground hover:bg-red-800",
        outline: "text-foreground",
        success: "border-transparent bg-green-400 text-primary-foreground hover:bg-green-500",
        yellow: "border-transparent bg-yellow-400 text-primary-foreground hover:bg-yellow-500",
        brown:  "border-transparent bg-amber-800 text-primary-foreground hover:bg-amber-800",

        pending: "border-transparent bg-orange-50 text-orange-500 hover:bg-orange-100",  
        destructive: "border-transparent bg-red-50 text-red-500 hover:bg-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
