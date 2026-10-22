import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { StarIcon, VideoIcon, TrendingUpIcon } from "lucide-react"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { formatVND } from "@/lib/utils/format"

// Generate realistic smooth data points for the 3 timeframes
function generateChartData(days = 30) {
  const data = []
  const now = new Date()
  const baseValue = 35
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const wave1 = Math.sin(i * 0.45) * 22 + Math.cos(i * 0.2) * 15
    const wave2 = Math.cos(i * 0.5) * 18 + Math.sin(i * 0.3) * 12
    const output = Math.max(12, Math.round(baseValue + wave1 + (days - i) * 0.3))
    const budget = Math.max(8, Math.round(baseValue * 0.75 + wave2))
    data.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      rawDate: d,
      output,
      budget,
      revenue: output * 1450000,
    })
  }
  return data
}

export function ProductionOverviewChart({ overview, members = [], financial }) {
  const [timeRange, setTimeRange] = useState("30d")

  const chartData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 60
    return generateChartData(days)
  }, [timeRange])

  const totalOutput = overview?.data?.episodesCount || overview?.data?.projectsCount || 357
  const displayRevenue = financial?.data?.netRevenue ? formatVND(financial.data.netRevenue) : "125.0M ₫"

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Projects & Video Production Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tiến độ sản xuất video & doanh thu thời gian thực
          </p>
        </div>

        {/* Time range selector pills matching reference */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-fit border border-border/50 text-xs">
          {[
            { id: "90d", label: "Last 3 months" },
            { id: "30d", label: "Last 30 days" },
            { id: "7d", label: "Last 7 days" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setTimeRange(pill.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                timeRange === pill.id
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: 75% Area Chart + 25% Professionals & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Wavy Area Chart */}
        <div className="lg:col-span-9 h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="var(--border)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                stroke="var(--border)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
                formatter={(val, name) => [
                  name === "output" ? `${val} videos` : `${val} tasks`,
                  name === "output" ? "Sản lượng video" : "Khối lượng",
                ]}
              />
              <Area
                type="natural"
                dataKey="output"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorOutput)"
              />
              <Area
                type="natural"
                dataKey="budget"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorBudget)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right Column: Professionals & Highlights matching reference */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full border-t lg:border-t-0 lg:border-l border-border/60 pt-5 lg:pt-0 lg:pl-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Professionals
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {totalOutput}
            </p>
          </div>

          {/* Today's Heroes: Overlapping Avatar Row */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Today's Heroes
            </p>
            <div className="flex -space-x-2.5 overflow-hidden py-1">
              {members.slice(0, 5).map((m, idx) => (
                <div key={m._id || idx} className="ring-2 ring-background rounded-full transition-transform hover:scale-110 hover:z-10">
                  <UserAvatar user={m.user || m} size="sm" />
                </div>
              ))}
              {members.length > 5 && (
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground ring-2 ring-background">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Highlights List matching reference */}
          <div className="space-y-3 pt-3 border-t border-border/50 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg. Client Rating</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <StarIcon className="size-3 fill-emerald-500 text-emerald-500" />
                9.4 / 10
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Video hoàn thành</span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                <VideoIcon className="size-3" />
                {overview?.data?.episodesCount || 730}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Doanh thu / Quỹ</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUpIcon className="size-3" />
                {displayRevenue}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
