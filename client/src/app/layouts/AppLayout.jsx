import { useCallback, useEffect, useState } from "react"
import { Outlet } from "react-router"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppSidebar } from "@/components/layout/AppSidebar"

const STORAGE_KEY = "lh_sidebar_collapsed"

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(!c))
      } catch {
        // storage unavailable: the choice lasts for this session only
      }
      return !c
    })
  }, [])

  // Ctrl/Cmd+B toggles the sidebar, except while typing in a field.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "b") return
      if (e.target.closest?.("input, textarea, [contenteditable='true']")) return
      e.preventDefault()
      toggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  return (
    <div className="flex min-h-svh w-full bg-sidebar antialiased lg:h-svh lg:overflow-hidden">
      <AppSidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col bg-background transition-[margin,border-radius] duration-200 ease-out lg:my-2 lg:mr-2 lg:rounded-2xl lg:border lg:border-border/70 lg:shadow-xs lg:overflow-hidden">
        <AppHeader onToggleSidebar={toggle} sidebarCollapsed={collapsed} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
