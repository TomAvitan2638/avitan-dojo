import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/50 p-8 shadow-lg backdrop-blur-xl transition-[box-shadow,transform] duration-300 ease-out",
        className
      )}
    >
      <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-white md:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mb-8 text-center text-sm leading-relaxed text-white/75">
          {subtitle}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      {children}
    </div>
  );
}
