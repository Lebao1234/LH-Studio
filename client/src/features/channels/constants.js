export const CHANNEL_STATUS = {
  active: { label: "Hoạt động", tone: "success" },
  inactive: { label: "Ngừng hoạt động", tone: "muted" },
}

export const channelStatusOptions = Object.entries(CHANNEL_STATUS).map(([value, v]) => ({ value, label: v.label }))
