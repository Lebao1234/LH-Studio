import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme()
  const mounted = true

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const handleToggle = (checked) => {
    setTheme(checked ? "dark" : "light")
  }

  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className || ""}`}>
        <SunIcon className="size-4 text-muted-foreground" />
        <div className="h-[18.4px] w-[32px] rounded-full bg-input/80" />
        <MoonIcon className="size-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-1 select-none ${className || ""}`}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      <button
        type="button"
        aria-label="Chế độ sáng"
        onClick={() => setTheme("light")}
        className={`transition-colors hover:text-foreground focus-visible:outline-none cursor-pointer ${
          !isDark ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <SunIcon className="size-4" />
      </button>

      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label="Chuyển đổi giao diện sáng/tối"
        className="cursor-pointer"
      />

      <button
        type="button"
        aria-label="Chế độ tối"
        onClick={() => setTheme("dark")}
        className={`transition-colors hover:text-foreground focus-visible:outline-none cursor-pointer ${
          isDark ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MoonIcon className="size-4" />
      </button>
    </div>
  )
}
