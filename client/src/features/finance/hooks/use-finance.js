import { useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { financeApi } from "@/lib/api/finances.api"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { periodRange } from "../lib/finance-utils"

export const FINANCE_FILTER_DEFAULTS = {
  month: "",
  range: "month",
  start: "",
  end: "",
  projectId: "all",
  type: "all",
  categoryId: "all",
  status: "all",
  search: "",
  page: "1",
}

/**
 * URL-backed finance filters plus the derived API params.
 * `reportParams` feed summary/category reports (the API has no status/search there);
 * `ledgerParams` feed transaction lists and the CSV export.
 */
export function useFinanceFilters() {
  const [filters, setFilter, setFilters] = useUrlFilters(FINANCE_FILTER_DEFAULTS)
  const derived = useMemo(() => {
    const { from, to } = periodRange(filters)
    const scope = { from, to, projectId: filters.projectId, type: filters.type, categoryId: filters.categoryId }
    return {
      reportParams: scope,
      ledgerParams: { ...scope, status: filters.status, search: filters.search },
    }
  }, [filters])
  return { filters, setFilter, setFilters, ...derived }
}

export const financeKeys = {
  all: ["finance"],
  summary: (p) => ["finance", "summary", p],
  byCategory: (p) => ["finance", "expenses-by-category", p],
  transactions: (p) => ["finance", "transactions", p],
  transaction: (id) => ["finance", "transaction", id],
  categories: (p) => ["finance", "categories", p],
}

export function useFinanceSummary(params) {
  return useQuery({ queryKey: financeKeys.summary(params), queryFn: () => financeApi.summary(params), placeholderData: keepPreviousData })
}

export function useExpensesByCategory(params) {
  return useQuery({
    queryKey: financeKeys.byCategory(params),
    queryFn: () => financeApi.expensesByCategory(params),
    placeholderData: keepPreviousData,
  })
}

export function useTransactions(params, options = {}) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => financeApi.transactions(params),
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useTransaction(id) {
  return useQuery({ queryKey: financeKeys.transaction(id), queryFn: () => financeApi.transaction(id), enabled: Boolean(id) })
}

export function useFinanceCategories(params = {}) {
  return useQuery({ queryKey: financeKeys.categories(params), queryFn: () => financeApi.categories(params), staleTime: 60_000 })
}

/** Mutation that refreshes every finance and dashboard query on success. */
export function useFinanceMutation(mutationFn, { onSuccess, ...options } = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([qc.invalidateQueries({ queryKey: ["finance"] }), qc.invalidateQueries({ queryKey: ["dashboard"] })])
      return onSuccess?.(...args)
    },
  })
}

/** Increments every time `open` flips to true — key a dialog body with it to reset state per opening. */
export function useOpenSession(open) {
  const [state, setState] = useState({ open, session: open ? 1 : 0 })
  if (state.open !== open) setState({ open, session: open ? state.session + 1 : state.session })
  return state.session
}

/** Category options for a filter or form, optionally restricted by type / active flag. */
export function useCategoryOptions({ type, activeOnly = false, keepId } = {}) {
  const { data: categories = [], isLoading } = useFinanceCategories()
  const items = useMemo(
    () =>
      categories
        .filter((c) => !type || type === "all" || c.type === type)
        .filter((c) => !activeOnly || c.isActive || c._id === keepId)
        .map((c) => ({
          value: c._id,
          label: `${!type || type === "all" ? (c.type === "income" ? "Thu · " : "Chi · ") : ""}${c.name}${c.isActive ? "" : " (ngừng)"}`,
        })),
    [categories, type, activeOnly, keepId],
  )
  return { options: items, isLoading }
}
