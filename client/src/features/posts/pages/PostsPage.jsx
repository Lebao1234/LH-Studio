import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/PageHeader"
import { usePermissions } from "@/features/auth/auth-context"
import { ChannelsTab } from "@/features/channels/components/ChannelsTab"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { PostFormDialog } from "../components/PostFormDialog"
import { PostsTab } from "../components/PostsTab"

const DEFAULTS = {
  tab: "posts",
  search: "",
  status: "all",
  platform: "all",
  channel: "all",
  project: "all",
  independent: "",
  page: "1",
}

export default function PostsPage() {
  const { canWrite } = usePermissions()
  const [filters, , setFilters] = useUrlFilters(DEFAULTS)
  const [creating, setCreating] = useState(false)
  const tab = filters.tab === "channels" ? "channels" : "posts"

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Bài viết & kênh"
        description="Lên kế hoạch, ghi nhận bài đã đăng thủ công và theo dõi số liệu trên từng kênh."
        actions={
          canWrite &&
          tab === "posts" && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon /> Tạo bài viết
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => setFilters({ tab: v })}>
        <TabsList>
          <TabsTrigger value="posts" className="px-3">
            Bài viết
          </TabsTrigger>
          <TabsTrigger value="channels" className="px-3">
            Kênh
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="pt-1">
          <PostsTab filters={filters} setFilters={setFilters} />
        </TabsContent>
        <TabsContent value="channels" className="pt-1">
          <ChannelsTab />
        </TabsContent>
      </Tabs>

      <PostFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
