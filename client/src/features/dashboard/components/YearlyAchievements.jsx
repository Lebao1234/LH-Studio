import { AwardIcon } from "lucide-react"

export function YearlyAchievements({ projects = [] }) {
  const currentYearCount = projects.length || 57
  const years = [
    { year: 2026, count: currentYearCount, percentage: 88 },
    { year: 2025, count: 29, percentage: 48 },
    { year: 2024, count: 35, percentage: 58 },
  ]

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AwardIcon className="size-4 text-sky-500" />
        <h3 className="font-heading text-sm font-bold text-foreground">
          Achievement by Year (Sản lượng qua các năm)
        </h3>
      </div>

      {/* Horizontal Bars matching reference image */}
      <div className="space-y-4 my-auto">
        {years.map((item) => (
          <div key={item.year} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-foreground">{item.count}</span>
                <span className="text-muted-foreground font-medium">projects</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{item.year}</span>
            </div>

            {/* Blue Rounded Bar */}
            <div className="h-3 w-full rounded-md bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-md bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
        Tăng trưởng sản lượng đạt +42% so với cùng kỳ năm trước.
      </p>
    </div>
  )
}

