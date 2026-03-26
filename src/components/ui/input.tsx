import * as React from "react";
import { cn } from "@/lib/utils";
import { formControlSurfaceClasses } from "@/lib/form-field";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium",
          formControlSurfaceClasses(),
          className
        )}
        {...props}
      />
    );
  }
);

export { Input };
