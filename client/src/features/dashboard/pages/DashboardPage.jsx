import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RotateCwIcon, LayoutDashboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/features/auth/auth-context"
import { projectsApi } from "@/lib/api/projects.api"
import { tasksApi } from "@/lib/api/tasks.api"
import { studioApi } from "@/lib/api/studios.api"
import {
  dashboardKeys,
  useDashboardOverview,
  useFinancialSummary,
  useProjectStatusSummary,
  useTasksSummary,
} from "../hooks/use-dashboard"
import { WeeklyMetricCards } from "../components/WeeklyMetricCards"
import { WaveAreaChart } from "../components/WaveAreaChart"
import { WeeklyProductionBarChart } from "../components/WeeklyProductionBarChart"
import { ProductionDonutChart } from "../components/ProductionDonutChart"
import { RecentProjectsTable } from "../components/RecentProjectsTable"

export default function DashboardPage() {
  const { canSeeFinance } = usePermissions()
  const queryClient = useQueryClient()

  // Primary dashboard queries
  const overview = useDashboardOverview()
  const projectStatus = useProjectStatusSummary()
  const tasksSummary = useTasksSummary()
  const financial = useFinancialSummary(canSeeFinance)

  // Direct entity queries for rich interactive charts & table
  const projectsQuery = useQuery({
    queryKey: ["projects", { limit: 100 }],
    queryFn: () => projectsApi.list({ limit: 100 }),
  })

  const tasksQuery = useQuery({
    queryKey: ["tasks", { limit: 100 }],
    queryFn: () => tasksApi.list({ limit: 100 }),
  })

  const membersQuery = useQuery({
    queryKey: ["studios", "current", "members"],
    queryFn: () => studioApi.members(),
  })

  const projects = projectsQuery.data?.items ?? []
  const tasks = tasksQuery.data?.items ?? []

  const fetching = [
    overview,
    projectStatus,
    tasksSummary,
    projectsQuery,
    tasksQuery,
    membersQuery,
    ...(canSeeFinance ? [financial] : []),
  ].some((q) => q.isFetching)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    queryClient.invalidateQueries({ queryKey: ["studios"] })
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header - Greeting removed */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <LayoutDashboardIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Bảng điều khiển sản xuất
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tổng quan chỉ số hiệu suất, tiến độ video và dự án qua tuần
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          disabled={fetching}
          onClick={handleRefresh}
          className="self-start sm:self-auto gap-2 rounded-xl text-xs font-semibold shadow-xs"
        >
          <RotateCwIcon className={`size-3.5 ${fetching ? "animate-spin motion-reduce:animate-none" : ""}`} />
          {fetching ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
        </Button>
      </div>

      {/* 1. Top Section: 4 Weekly Metric Cards */}
      <WeeklyMetricCards
        overview={overview}
        projects={projects}
        tasks={tasks}
        financial={financial}
      />

      {/* 2. Biểu đồ sóng (Wave Area Chart) */}
      <WaveAreaChart />

      {/* 3. Biểu đồ cột (Bar Chart) & Biểu đồ tròn (Donut/Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <WeeklyProductionBarChart className="h-full" />
        </div>
        <div className="lg:col-span-5">
          <ProductionDonutChart tasks={tasks} projects={projects} className="h-full" />
        </div>
      </div>

      {/* 4. Bottom Section: Recent Projects Table */}
      <RecentProjectsTable projects={projects} />
    </div>
  )
}
