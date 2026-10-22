import { useState } from "react"
import { useNavigate } from "react-router"
import { KeyRoundIcon, LogOutIcon, MenuIcon, PanelLeftClose, PanelLeftOpen, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { useAuth } from "@/features/auth/auth-context"
import { ChangePasswordDialog } from "@/features/auth/components/ChangePasswordDialog"
import { STUDIO_ROLES } from "@/lib/constants/labels"
import { BrandMark, SidebarNav } from "./AppSidebar"

export function AppHeader({ onToggleSidebar, sidebarCollapsed }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  const handleLogout = async () => {
    await logout().catch(() => {})
    toast.success("Đã đăng xuất.")
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-3.5 backdrop-blur supports-backdrop-filter:bg-background/80 lg:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setMobileOpen(true)}>
        <MenuIcon />
      </Button>
      <div className="lg:hidden">
        <BrandMark compact />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="hidden size-8 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              aria-keyshortcuts="Control+B"
              onClick={onToggleSidebar}
            />
          }
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-4.5" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4.5" aria-hidden />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"} (Ctrl+B)
        </TooltipContent>
      </Tooltip>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-9 gap-2 rounded-full pr-3 pl-1" aria-label="Tài khoản" />}
          >
            <UserAvatar user={user} size="sm" />
            <span className="hidden max-w-36 truncate text-sm sm:inline">{user?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                </div>
                {role && <StatusBadge map={STUDIO_ROLES} value={role} />}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserIcon /> Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPwOpen(true)}>
              <KeyRoundIcon /> Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOutIcon /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar px-3 py-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex justify-center py-2">
            <BrandMark />
          </div>
          <div className="mt-6">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </header>
  )
}
