import React from "react";
import { cn } from "@/lib/utils";

export const MuiShadcnInput = ({
  label,
  id,
  error,
  helperText,
  inputRef,
  InputProps,
  inputProps,
}) => {
  return (
    <div className="space-y-1.5">
      <input
        id={id}
        ref={inputRef}
        {...inputProps}
        className={cn(
          "w-full px-3 py-2.5 rounded-lg border bg-card text-card-foreground transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "placeholder:text-muted-foreground",
          error
            ? "border-destructive focus:ring-destructive/50 focus:border-destructive animate-shake"
            : "border-input hover:border-primary/50",
        )}
      />
      {error && (
        <p className="text-sm text-destructive font-medium animate-fade-in">
          {helperText}
        </p>
      )}
    </div>
  );
};
