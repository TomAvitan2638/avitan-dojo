import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type AuthInputProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput({ label, error, id, className, ...props }, ref) {
    const inputId = id ?? React.useId();

    return (
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/90"
        >
          {label}
        </label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn(
            "h-11 border-white/15 bg-black/30 text-white placeholder:text-white/40",
            error && "border-red-400/80 focus-visible:ring-red-400/50",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-err`} className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
