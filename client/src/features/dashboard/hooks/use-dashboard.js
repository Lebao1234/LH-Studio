import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api/studios.api"

const STALE = 30_000

export const dashboardKeys = {
  all: ["dashboard"],
  overview: ["dashboard", "overview"],
  projectStatus: ["dashboard", "project-status"],
  tasksSummary: ["dashboard", "tasks-summary"],
  upcomingPosts: ["dashboard", "upcoming-posts"],
  financialSummary: ["dashboard", "financial-summary"],
  production: (period) => ["dashboard", "production", period],
}

export function useDashboardOverview() {
  return useQuery({ queryKey: dashboardKeys.overview, queryFn: dashboardApi.overview, staleTime: STALE })
}

export function useProjectStatusSummary() {
  return useQuery({ queryKey: dashboardKeys.projectStatus, queryFn: dashboardApi.projectStatus, staleTime: STALE })
}

export function useTasksSummary() {
  return useQuery({ queryKey: dashboardKeys.tasksSummary, queryFn: dashboardApi.tasksSummary, staleTime: STALE })
}

export function useUpcomingPosts() {
  return useQuery({ queryKey: dashboardKeys.upcomingPosts, queryFn: dashboardApi.upcomingPosts, staleTime: STALE })
}

/** Posts published / tasks completed / tasks due per day (week, month) or per week (quarter). */
export function useProductionTrend(period = "week") {
  return useQuery({
    queryKey: dashboardKeys.production(period),
    queryFn: () => dashboardApi.production(period),
    staleTime: STALE,
    placeholderData: (prev) => prev,
  })
}

/** Finance is manager-only: pass `enabled = canSeeFinance` so the request is never sent otherwise. */
export function useFinancialSummary(enabled) {
  return useQuery({
    queryKey: dashboardKeys.financialSummary,
    queryFn: dashboardApi.financialSummary,
    staleTime: STALE,
    enabled: Boolean(enabled),
  })
}
