import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EmptyState } from "./EmptyState"
import { ErrorState } from "./ErrorState"

/**
 * Declarative table with loading / error / empty states.
 * columns: [{ key, header, cell: (row) => node, className, headClassName }]
 */
export function DataTable({
  columns,
  rows,
  isLoading,
  error,
  onRetry,
  onRowClick,
  rowKey = (r) => r._id ?? r.id,
  empty,
  skeletonRows = 6,
  className,
}) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn("h-9 px-3 text-xs font-medium text-muted-foreground", c.headClassName)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`s${i}`} className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableCell key={c.key} className="px-3">
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading &&
            rows?.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn("group/item", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn("px-3 py-2.5", c.className)}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!isLoading && !rows?.length && (empty ?? <EmptyState className="m-3 border-0" />)}
    </div>
  )
}

export function Pagination({ meta, onPageChange, className }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <div className={cn("flex items-center justify-between gap-2 text-xs text-muted-foreground", className)}>
      <span>
        Trang {meta.page}/{meta.totalPages} · {meta.total} mục
      </span>
      <div className="flex gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Trang trước" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Trang sau"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
