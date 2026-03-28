"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { DataWriteSyncProvider } from "@/components/providers/data-write-sync-provider";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      <DataWriteSyncProvider>{children}</DataWriteSyncProvider>
    </QueryClientProvider>
  );
}
