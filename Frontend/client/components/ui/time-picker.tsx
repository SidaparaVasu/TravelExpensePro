import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

export function FormTimePicker({
  label,
  required,
  value,
  onChange,
  error,
  className,
  ...props
}: {
  label: string;
  required?: boolean;
  value: string | null;
  onChange: (val: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <TimePicker
        value={value ? dayjs(value, "HH:mm") : null}
        onChange={(newVal) => {
          const formatted = newVal ? newVal.format("HH:mm") : "";
          onChange(formatted);
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            error: Boolean(error),
            helperText: error,

            className: "w-full",

            InputProps: {
              classes: {
                root: cn(
                  "py-0 rounded-lg border bg-card text-card-foreground transition-all duration-200",
                  error
                    ? "border-destructive animate-shake focus-within:ring-destructive/50"
                    : "border-input hover:border-primary/50 focus-within:ring-primary/50",
                  "focus-within:border-primary focus-within:ring-2",
                  props.disabled && "opacity-50 cursor-not-allowed bg-muted",
                  className
                ),
                notchedOutline: "border-0", // remove default MUI outline
                input: cn(
                  "px-3 py-0 border-0 placeholder:text-muted-foreground",
                  "!text-card-foreground" // force text color
                ),
              },
            },

            FormHelperTextProps: {
              className: "text-destructive text-sm font-medium mt-1",
            },
          },
        }}
      />
    </div>
  );
}
