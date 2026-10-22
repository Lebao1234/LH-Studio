import { useState } from "react"

/**
 * Returns `value` while `open`, and the last open value while the dialog animates closed
 * (parents usually clear their state on close). `value` must be referentially stable.
 */
export function useStickyValue(open, value) {
  const [kept, setKept] = useState(value)
  if (open && kept !== value) setKept(value)
  return open ? value : kept
}
