import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Appended to default title utilities (e.g. login-only brand colors). */
  titleClassName?: string;
  /** Appended to default subtitle utilities. */
  subtitleClassName?: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  className,
  titleClassName,
  subtitleClassName,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-border bg-card/[0.98] p-8 shadow-lg backdrop-blur-xl transition-[box-shadow,transform] duration-300 ease-out",
        className
      )}
    >
      <div
        className={cn(
          "mb-8 rounded-xl border border-stone-400/35 bg-background/82 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-[2px] sm:px-5",
          !subtitle && "pb-4"
        )}
      >
        <h1
          className={cn(
            "text-center text-3xl font-extrabold leading-tight tracking-tight text-stone-950 sm:text-4xl",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-3 text-center text-lg font-semibold leading-relaxed text-stone-800 sm:text-xl sm:leading-8",
              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
