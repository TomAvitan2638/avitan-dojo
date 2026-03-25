"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Layers,
  Building2,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "תלמידים", icon: Users },
  { href: "/dashboard/groups", label: "קבוצות", icon: Layers },
  { href: "/dashboard/instructors", label: "מאמנים", icon: UserCog },
  { href: "/dashboard/centers", label: "מרכזים", icon: Building2 },
  { href: "/dashboard/payments", label: "תשלומים", icon: Receipt },
  { href: "/dashboard/system-data", label: "נתוני מערכת", icon: Layers },
];

type SidebarProps = {
  pendingHref?: string | null;
  onNavClick?: (href: string) => void;
};

export function Sidebar({ pendingHref = null, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-screen border-l border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => onNavClick?.("/dashboard")}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-dojo-red">
              <Image
                src="/images/logo.jpeg"
                alt="Avitan Dojo"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  Avitan Dojo
                </span>
                <span className="text-xs text-muted-foreground">
                  ניהול מכון
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isPathActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isPending = pendingHref === item.href;
            const isActive = isPathActive || isPending;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavClick?.(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-dojo-red text-primary-foreground shadow-lg shadow-dojo-red/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("size-5 shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronLeft className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
