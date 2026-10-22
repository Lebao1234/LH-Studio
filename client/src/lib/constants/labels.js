// Vietnamese labels + tone for every enum the API exposes. `tone` maps to StatusBadge styles.

const opts = (map) => Object.entries(map).map(([value, v]) => ({ value, label: v.label }))

export const STUDIO_ROLES = {
  owner: { label: "Chủ sở hữu", tone: "success" },
  admin: { label: "Quản trị", tone: "info" },
  member: { label: "Thành viên", tone: "neutral" },
  viewer: { label: "Người xem", tone: "muted" },
}

export const PROJECT_ROLES = {
  manager: { label: "Quản lý", tone: "success" },
  editor: { label: "Biên tập", tone: "info" },
  creator: { label: "Sáng tạo", tone: "violet" },
  member: { label: "Thành viên", tone: "neutral" },
}

export const PROJECT_STATUS = {
  planning: { label: "Lên kế hoạch", tone: "info" },
  in_progress: { label: "Đang sản xuất", tone: "success" },
  on_hold: { label: "Tạm dừng", tone: "warning" },
  completed: { label: "Hoàn thành", tone: "muted" },
  cancelled: { label: "Đã hủy", tone: "danger" },
}

export const PRIORITY = {
  low: { label: "Thấp", tone: "muted" },
  medium: { label: "Trung bình", tone: "info" },
  high: { label: "Cao", tone: "warning" },
  urgent: { label: "Khẩn cấp", tone: "danger" },
}

export const EPISODE_STATUS = {
  planned: { label: "Dự kiến", tone: "muted" },
  scripting: { label: "Viết kịch bản", tone: "info" },
  generating: { label: "Tạo AI", tone: "violet" },
  editing: { label: "Dựng phim", tone: "warning" },
  review: { label: "Duyệt", tone: "info" },
  completed: { label: "Hoàn thành", tone: "success" },
}

export const TASK_STATUS = {
  todo: { label: "Cần làm", tone: "muted" },
  in_progress: { label: "Đang làm", tone: "info" },
  review: { label: "Chờ duyệt", tone: "warning" },
  done: { label: "Hoàn thành", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "danger" },
}

export const TASK_TYPES = {
  script: { label: "Kịch bản" },
  ai_generation: { label: "Tạo AI" },
  editing: { label: "Dựng phim" },
  review: { label: "Duyệt" },
  other: { label: "Khác" },
}

export const ASSIGNMENT_ROLES = {
  lead: { label: "Phụ trách chính", tone: "success" },
  contributor: { label: "Hỗ trợ", tone: "neutral" },
}

export const PLATFORMS = {
  youtube: { label: "YouTube", tone: "danger" },
  tiktok: { label: "TikTok", tone: "violet" },
  facebook: { label: "Facebook", tone: "info" },
  other: { label: "Khác", tone: "muted" },
}

export const POST_STATUS = {
  draft: { label: "Bản nháp", tone: "muted" },
  scheduled: { label: "Đã lên lịch", tone: "info" },
  published: { label: "Đã đăng", tone: "success" },
  failed: { label: "Thất bại", tone: "danger" },
  cancelled: { label: "Đã hủy", tone: "muted" },
}

export const FINANCE_TYPES = {
  income: { label: "Thu", tone: "success" },
  expense: { label: "Chi", tone: "expense" },
}

export const TRANSACTION_STATUS = {
  planned: { label: "Dự kiến", tone: "muted" },
  pending: { label: "Chờ thanh toán", tone: "warning" },
  partially_paid: { label: "Thanh toán một phần", tone: "info" },
  paid: { label: "Đã thanh toán", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "danger" },
}

export const PAYMENT_METHODS = {
  bank_transfer: { label: "Chuyển khoản" },
  cash: { label: "Tiền mặt" },
  other: { label: "Khác" },
}

export const PROJECT_CATEGORIES = {
  KID: { label: "Thiếu nhi (Kids)", prefix: "KID", description: "Hoạt hình, bài hát, giáo dục trẻ em" },
  ANI: { label: "Hoạt hình (Animation)", prefix: "ANI", description: "Hoạt hình 2D/3D, Anime" },
  TKV: { label: "Truyện kỳ Việt", prefix: "TKV", description: "Cổ tích, truyền thuyết dân gian" },
  DOC: { label: "Phim tài liệu (Doc)", prefix: "DOC", description: "Phim tài liệu, phóng sự, lịch sử" },
  SHR: { label: "Video ngắn (Shorts/Reels)", prefix: "SHR", description: "Nội dung ngắn đa nền tảng" },
  POD: { label: "Podcast & Talkshow", prefix: "POD", description: "Trò chuyện, phỏng vấn, âm thanh" },
  GEN: { label: "Chung / Khác (General)", prefix: "GEN", description: "Dự án tổng hợp khác" },
}

export const options = {
  studioRoles: opts(STUDIO_ROLES),
  projectRoles: opts(PROJECT_ROLES),
  projectStatus: opts(PROJECT_STATUS),
  projectCategories: Object.entries(PROJECT_CATEGORIES).map(([value, v]) => ({ value, label: v.label, prefix: v.prefix })),
  projectPriority: opts({ low: PRIORITY.low, medium: PRIORITY.medium, high: PRIORITY.high }),
  priority: opts(PRIORITY),
  episodeStatus: opts(EPISODE_STATUS),
  taskStatus: opts(TASK_STATUS),
  taskTypes: opts(TASK_TYPES),
  assignmentRoles: opts(ASSIGNMENT_ROLES),
  platforms: opts(PLATFORMS),
  postStatus: opts(POST_STATUS),
  financeTypes: opts(FINANCE_TYPES),
  transactionStatus: opts(TRANSACTION_STATUS),
  paymentMethods: opts(PAYMENT_METHODS),
}
