"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
};

export function AuthButton({
  loading,
  disabled,
  children,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "h-11 w-full rounded-xl text-base font-semibold transition-all duration-200",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span className={loading ? "opacity-90" : undefined}>{children}</span>
      {loading ? <span className="sr-only">טוען</span> : null}
    </Button>
  );
}
