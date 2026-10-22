import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/**
 * Thin wrapper over the Base UI select.
 * options: [{ value, label }]. Use value "all" (with allLabel) for an unfiltered option.
 */
export function SimpleSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  allLabel,
  className,
  size = "default",
  disabled,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}) {
  const items = allLabel ? [{ value: "all", label: allLabel }, ...options] : options
  const normalized = value === undefined || value === null || value === "" ? (allLabel ? "all" : null) : String(value)

  return (
    <Select items={items} value={normalized} onValueChange={(v) => onChange?.(v ?? "")} disabled={disabled}>
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} aria-invalid={ariaInvalid} className={cn("w-full min-w-0", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
