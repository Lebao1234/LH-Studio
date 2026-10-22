import { CalendarDaysIcon, ClapperboardIcon, LayoutDashboardIcon, ListChecksIcon, NewspaperIcon, UsersIcon, WalletIcon } from "lucide-react"

/** Sidebar groups follow the studio's flow: make the film, publish it, run the studio. */
export const NAV_GROUPS = [
  {
    label: "Sản xuất",
    items: [
      { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboardIcon },
      { to: "/projects", label: "Dự án phim", icon: ClapperboardIcon },
      { to: "/tasks", label: "Công việc", icon: ListChecksIcon },
    ],
  },
  {
    label: "Phát hành",
    items: [
      { to: "/posts", label: "Bài viết", icon: NewspaperIcon },
      { to: "/calendar", label: "Lịch đăng", icon: CalendarDaysIcon },
    ],
  },
  {
    label: "Studio",
    items: [
      { to: "/team", label: "Đội ngũ", icon: UsersIcon },
      { to: "/finance", label: "Tài chính", icon: WalletIcon, permission: "canSeeFinance" },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)
