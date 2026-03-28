import * as React from "react";
import { cn } from "@/lib/utils";
import { formControlSurfaceClasses } from "@/lib/form-field";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[88px] w-full px-3 py-2 text-base",
        formControlSurfaceClasses(),
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
