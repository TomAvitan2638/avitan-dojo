"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import { User, ChevronRight } from "lucide-react";

const ChevronDown = (Lucide as Record<string, ComponentType<{ className?: string }>>)
  .ChevronDown;
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutFromApp } from "@/lib/auth-logout-client";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  /** Optional back link - when provided, shows a back button before the title */
  backHref?: string;
  backLabel?: string;
}

export function Header({ title, backHref, backLabel }: HeaderProps) {
  const router = useRouter();
  const [isEasterOpen, setIsEasterOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  async function handleLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logoutFromApp();
      router.push("/login");
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {backHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={backHref}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
                {backLabel ?? "חזרה לרשימה"}
              </Link>
            </Button>
          )}
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2 px-2"
            aria-label="פתיחת הפתעה"
            onClick={() => setIsEasterOpen(true)}
          >
            <Avatar className="h-8 w-8 shrink-0 border border-border">
              <AvatarImage
                src="/images/master-seated.jpeg"
                alt="מנהל"
                className="object-cover"
              />
              <AvatarFallback>
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:block">
              מנהל מערכת
            </span>
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground"
                aria-label="תפריט חשבון"
                disabled={logoutBusy}
              >
                <ChevronDown className="size-5 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              sideOffset={6}
              collisionPadding={12}
              className="min-w-[12rem]"
            >
              <DropdownMenuItem
                variant="destructive"
                disabled={logoutBusy}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleLogout();
                }}
              >
                {logoutBusy ? "מתנתק…" : "התנתק מהמערכת"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={isEasterOpen} onOpenChange={setIsEasterOpen}>
        <DialogContent
          dir="rtl"
          className={cn(
            "gap-0 overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-lg",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          overlayClassName="bg-black/60 backdrop-blur-[2px]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>הפתעה</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center px-6 pb-6 pt-10">
            <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-border/50 bg-secondary/30">
              <Image
                src="/images/easter-egg.png"
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, 448px"
                priority
              />
            </div>
            <p className="mt-6 text-center text-lg font-medium leading-relaxed text-foreground">
              אוהב אותך אבא ❤️
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
