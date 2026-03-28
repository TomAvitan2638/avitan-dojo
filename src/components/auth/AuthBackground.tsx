"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const BG_BY_PATH: Record<string, string> = {
  "/login": "/images/auth/bg-epic.png",
  "/mfa-verify": "/images/auth/bg-seiza.png",
  "/mfa-setup": "/images/auth/bg-seiza.png",
  "/forgot-password": "/images/auth/bg-stance.png",
  "/reset-password": "/images/auth/bg-seiza.png",
};

export function AuthBackground() {
  const pathname = usePathname();
  const src = BG_BY_PATH[pathname] ?? "/images/auth/bg-epic.png";

  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover object-[center_18%]"
      />
      {/* ~0.65–0.75 opacity dark overlay for readability */}
      <div
        className="absolute inset-0 -z-20 bg-background/88"
        aria-hidden
      />
    </>
  );
}
