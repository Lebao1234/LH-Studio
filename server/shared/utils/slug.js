/** Vietnamese-aware slug: "LH Studio Đà Nẵng" → "lh-studio-da-nang". */
export function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'studio';
}
