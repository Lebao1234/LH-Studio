import { Link } from "react-router"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { RadialBrandPanel } from "./RadialBrandPanel"

export function AuthShell({ title, description, children, footer }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-muted/20 px-4 py-8 sm:px-6 lg:px-8 text-foreground">
      {/* Top Bar with Brand Link & Theme Toggle */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="LH Studio Trang chủ"
        >
          <img src="/Logo.png" alt="LH Studio" className="size-9 object-contain" />
          <span className="font-heading text-base font-semibold tracking-tight hidden sm:inline">LH Studio</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Main Card Container matching the reference design */}
      <div className="w-full max-w-4xl rounded-2xl md:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div>{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>

        {/* Right Column: Radial Compass Graphic & Brand Mascot */}
        <RadialBrandPanel />
      </div>

      {/* Terms and Privacy Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground max-w-md px-4">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <span className="underline underline-offset-4 cursor-pointer hover:text-foreground">
          Điều khoản dịch vụ
        </span>{" "}
        và{" "}
        <span className="underline underline-offset-4 cursor-pointer hover:text-foreground">
          Chính sách quyền riêng tư
        </span>{" "}
        của LH Studio.
      </p>
    </div>
  )
}
