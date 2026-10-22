import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

/** Debounced search box; calls onChange 300ms after typing stops. */
export function SearchInput({ value = "", onChange, placeholder = "Tìm kiếm...", className }) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)

  // External value changed (e.g. filters reset): adopt it during render.
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return undefined
    const t = setTimeout(() => onChange?.(draft), 300)
    return () => clearTimeout(t)
  }, [draft, value, onChange])

  return (
    <InputGroup className={cn("w-full sm:w-64", className)}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput aria-label={placeholder} placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} />
    </InputGroup>
  )
}
