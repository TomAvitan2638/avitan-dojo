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
          className="block text-base font-medium text-foreground"
        >
          {label}
        </label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn(
            "h-11 border-input bg-popover text-foreground placeholder:text-muted-foreground",
            error && "border-destructive/80 focus-visible:ring-destructive/40",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-err`} className="text-base text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
