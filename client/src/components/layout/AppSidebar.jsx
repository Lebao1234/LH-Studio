import { NavLink } from "react-router"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { usePermissions } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"
import { NAV_GROUPS } from "./nav-items"

/** Prominent logo brandmark with balanced proportional sizing. */
export function BrandMark({ className, compact = false }) {
  return (
    <div className={cn("flex min-w-0 items-center justify-center", className)}>
      <img
        src="/Logo.png"
        alt="LH Studio"
        className={cn(
          "shrink-0 object-contain transition-all duration-300 drop-shadow-sm select-none",
          compact ? "size-11" : "size-[104px] max-w-[150px]"
        )}
      />
    </div>
  )
}

const linkClass = (isActive, collapsed) =>
  cn(
    "relative flex h-9 items-center rounded-lg text-sm text-sidebar-foreground/75 outline-none transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    collapsed ? "w-9 justify-center" : "gap-2.5 px-2.5",
    isActive &&
      `bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:top-2 before:bottom-2 before:w-[3px] ${collapsed ? "before:-left-2" : "before:-left-3"} before:rounded-r-full before:bg-sidebar-primary [&_svg]:text-sidebar-primary`,
  )

export function SidebarNav({ onNavigate, collapsed = false }) {
  const perms = usePermissions()
  return (
    <nav aria-label="Điều hướng chính" className={cn("grid", collapsed ? "justify-items-center gap-3" : "gap-5")}>
      {NAV_GROUPS.map((group, gi) => {
        const items = group.items.filter((i) => !i.permission || perms[i.permission])
        if (!items.length) return null
        return (
          <div key={group.label} className="grid gap-0.5">
            {collapsed ? (
              gi > 0 && <span className="mx-auto mb-2 h-px w-5 bg-sidebar-foreground/15" aria-hidden />
            ) : (
              <p className="px-2.5 pb-1 text-xs text-sidebar-foreground/50">{group.label}</p>
            )}
            {items.map(({ to, label, icon: Icon }) =>
              collapsed ? (
                <Tooltip key={to}>
                  <TooltipTrigger
                    render={<NavLink to={to} onClick={onNavigate} aria-label={label} className={({ isActive }) => linkClass(isActive, true)} />}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => linkClass(isActive, false)}>
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </NavLink>
              ),
            )}
          </div>
        )
      })}
    </nav>
  )
}

/**
 * Desktop sidebar. The collapse toggle sits on the seam where the sidebar edge meets
 * the header's bottom rule, so it reads as a handle on the panel itself.
 */
export function AppSidebar({ collapsed }) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-svh shrink-0 flex-col bg-sidebar transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border-b border-sidebar-border/30 transition-all duration-200",
          collapsed ? "h-16 px-2" : "py-3.5 px-4 min-h-[120px]"
        )}
      >
        <NavLink
          to="/"
          aria-label="LH Studio Trang chủ"
          className="group flex items-center justify-center rounded-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark compact={collapsed} />
        </NavLink>
      </div>

      <div className={cn("flex-1 overflow-x-hidden overflow-y-auto pt-4 pb-6", collapsed ? "px-2" : "px-3")}>
        <SidebarNav collapsed={collapsed} />
      </div>
    </aside>
  )
}
