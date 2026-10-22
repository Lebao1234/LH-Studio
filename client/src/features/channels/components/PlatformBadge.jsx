import { StatusBadge } from "@/components/shared/StatusBadge"
import { PLATFORMS } from "@/lib/constants/labels"

/** Coloured platform pill (YouTube / TikTok / Facebook / Khác). */
export function PlatformBadge({ platform, className }) {
  return <StatusBadge map={PLATFORMS} value={platform} dot className={className} />
}

/** Channel name with its platform badge; `channel` is the populated `{ platform, name, handle }`. */
export function ChannelCell({ channel, className }) {
  if (!channel) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className={className}>
      <div className="flex min-w-0 items-center gap-1.5">
        <PlatformBadge platform={channel.platform} />
        <span className="truncate text-sm">{channel.name}</span>
      </div>
      {channel.handle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{channel.handle}</p>}
    </div>
  )
}
