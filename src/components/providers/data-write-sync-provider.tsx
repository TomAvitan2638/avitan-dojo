"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeDataWrites } from "@/lib/data-write-bus";
import { DASHBOARD_HOME_QUERY_ROOT } from "@/lib/dashboard-page-query";

const DataWriteGenerationContext = createContext<number>(0);

export function useDataWriteGeneration(): number {
  return useContext(DataWriteGenerationContext);
}

/**
 * Bumps a generation counter + invalidates dashboard queries whenever {@link notifyDataWrite} runs.
 * Binds dashboard React Query cache to "last known write" without listing every mutation site.
 */
export function DataWriteSyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    return subscribeDataWrites(() => {
      setGeneration((g) => g + 1);
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_HOME_QUERY_ROOT] });
    });
  }, [queryClient]);

  return (
    <DataWriteGenerationContext.Provider value={generation}>
      {children}
    </DataWriteGenerationContext.Provider>
  );
}
