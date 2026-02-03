"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface TaskFilters {
  status?: "open" | "submitted" | "completed";
  trafficLight?: "green" | "yellow" | "red";
  companyId?: string;
  period?: string;
  search?: string;
}

export function useTaskFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: TaskFilters = useMemo(
    () => ({
      status: (searchParams.get("status") as TaskFilters["status"]) || undefined,
      trafficLight: (searchParams.get("traffic") as TaskFilters["trafficLight"]) || undefined,
      companyId: searchParams.get("company") || undefined,
      period: searchParams.get("period") || undefined,
      search: searchParams.get("q") || undefined,
    }),
    [searchParams]
  );

  const updateFilters = useCallback(
    (updates: Partial<TaskFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update each filter
      Object.entries(updates).forEach(([key, value]) => {
        const paramKey =
          key === "trafficLight" ? "traffic" :
          key === "search" ? "q" :
          key === "companyId" ? "company" :
          key;

        if (value) {
          params.set(paramKey, value);
        } else {
          params.delete(paramKey);
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const setFilter = useCallback(
    (key: keyof TaskFilters, value: string | undefined) => {
      updateFilters({ [key]: value });
    },
    [updateFilters]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  return {
    filters,
    updateFilters,
    setFilter,
    clearFilters,
    activeFilterCount,
  };
}
