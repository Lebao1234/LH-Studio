import { cn } from "@/lib/utils"

export function RadialBrandPanel({ className }) {
  return (
    <div
      className={cn(
        "relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-50 dark:from-[#090e17] dark:via-[#0e172a] dark:to-[#090e17] border-l border-border/60 p-8 select-none",
        className
      )}
    >
      {/* Background radial geometry matching the reference design */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-45 dark:opacity-25">
        <svg className="w-[155%] h-[155%] text-foreground/30 animate-[spin_180s_linear_infinite]" viewBox="0 0 400 400" fill="none">
          {/* Concentric rings */}
          <circle cx="200" cy="200" r="54" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="82" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="158" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="200" cy="200" r="192" stroke="currentColor" strokeWidth="0.75" />

          {/* 12 Radial ray lines originating cleanly from the central circular boundary */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            const x1 = 200 + 54 * Math.cos(angle)
            const y1 = 200 + 54 * Math.sin(angle)
            const x2 = 200 + 195 * Math.cos(angle)
            const y2 = 200 + 195 * Math.sin(angle)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray={i % 2 === 0 ? "none" : "3 3"}
              />
            )
          })}
        </svg>
      </div>

      {/* Ambient subtle warm/blue backlight glow */}
      <div className="absolute size-64 rounded-full bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-amber-500/10 blur-3xl pointer-events-none" />

      {/* Central Circular Icon Container perfectly aligned with the radial compass */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative flex size-36 sm:size-40 items-center justify-center rounded-full border border-border/80 bg-background/90 dark:bg-card/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-500 hover:scale-105">
          <img
            src="/Logo.png"
            alt="LH Studio Logo"
            className="size-28 sm:size-32 object-contain drop-shadow-md select-none"
          />
        </div>

        <p className="mt-5 font-heading text-xl font-bold tracking-tight text-foreground">
          LH Studio
        </p>
        <p className="mt-1 text-xs text-muted-foreground max-w-[220px] leading-relaxed">
          Quản lý sản xuất phim & dự án toàn diện
        </p>
      </div>
    </div>
  )
}
