export const STUDIO_STATUS = ['active', 'inactive'];
export const USER_STATUS = ['active', 'suspended'];

export const STUDIO_ROLES = ['owner', 'admin', 'member', 'viewer'];
export const STUDIO_MANAGER_ROLES = ['owner', 'admin'];
export const MEMBER_STATUS = ['active', 'inactive', 'pending'];

export const PROJECT_STATUS = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
export const PROJECT_PRIORITY = ['low', 'medium', 'high'];
export const PROJECT_ROLES = ['manager', 'editor', 'creator', 'member'];
export const PROJECT_CATEGORIES = [
  { code: 'KID', label: 'Thiếu nhi (Kids)', desc: 'Hoạt hình, bài hát, giáo dục trẻ em' },
  { code: 'ANI', label: 'Hoạt hình (Animation)', desc: 'Hoạt hình 2D/3D, Anime' },
  { code: 'TKV', label: 'Truyện kỳ Việt (Folklore)', desc: 'Truyền thuyết, cổ tích dân gian' },
  { code: 'DOC', label: 'Phim tài liệu (Documentary)', desc: 'Phim tài liệu, phóng sự, lịch sử' },
  { code: 'SHR', label: 'Video ngắn (Shorts/Reels)', desc: 'Nội dung ngắn đa nền tảng' },
  { code: 'POD', label: 'Podcast & Talkshow', desc: 'Trò chuyện, phỏng vấn, âm thanh' },
  { code: 'GEN', label: 'Chung / Khác (General)', desc: 'Các thể loại dự án khác' },
];
export const PROJECT_CATEGORY_CODES = PROJECT_CATEGORIES.map((c) => c.code);

export const EPISODE_STATUS = ['planned', 'scripting', 'generating', 'editing', 'review', 'completed'];
/** Project roles that may create/edit episodes. */
export const EPISODE_WRITE_ROLES = ['manager', 'editor', 'creator'];

export const TASK_TYPES = ['script', 'ai_generation', 'editing', 'review', 'other'];
export const TASK_STATUS = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
export const TASK_OPEN_STATUS = ['todo', 'in_progress', 'review'];
export const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'];
export const ASSIGNMENT_ROLES = ['lead', 'contributor'];

export const PLATFORMS = ['youtube', 'tiktok', 'facebook', 'other'];
export const CHANNEL_STATUS = ['active', 'inactive'];
export const POST_STATUS = ['draft', 'scheduled', 'published', 'failed', 'cancelled'];
export const METRIC_SOURCES = ['manual', 'api'];

export const FINANCE_TYPES = ['income', 'expense'];
export const CURRENCIES = ['VND'];
export const TRANSACTION_STATUS = ['planned', 'pending', 'partially_paid', 'paid', 'cancelled'];
/** Statuses a client may set directly; the rest are derived from payments. */
export const TRANSACTION_MANUAL_STATUS = ['planned', 'pending', 'cancelled'];
export const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];
export const PAYMENT_KINDS = ['payment', 'reversal'];
