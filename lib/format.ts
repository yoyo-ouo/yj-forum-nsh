// 展示层纯函数：分类、时间、HTML 去标签。不依赖网络与组件，便于 nsh test 单测。

const CATEGORY_LABELS: Record<string, string> = {
  general: "综合",
  talk: "闲聊",
  question: "求助",
  share: "分享",
  creative: "创作",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6A8C89",
  talk: "#f59e0b",
  question: "#ef4444",
  share: "#10b981",
  creative: "#8b5cf6",
};

export interface CategoryOption {
  key: string;
  label: string;
  /** 后端实际使用的分类值：历史数据同时存在英文 key 与中文标签，需要多值合并。 */
  values: string[];
}

export const CATEGORIES: CategoryOption[] = [
  { key: "", label: "全部", values: [] },
  { key: "general", label: "综合", values: ["general", "综合"] },
  { key: "talk", label: "闲聊", values: ["talk", "闲聊"] },
  { key: "question", label: "求助", values: ["question", "求助"] },
  { key: "share", label: "分享", values: ["share", "分享"] },
  { key: "creative", label: "创作", values: ["creative", "创意"] },
];

export function categoryLabel(category?: string): string {
  if (!category) return "综合";
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.general;
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general;
}

/** 把帖子/评论正文（HTML 或 Markdown 残留）转成可读纯文本。实体在去标签之后解码（后端 summary 保留实体）。 */
export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** RFC3339 → 「刚刚 / N 分钟前 / N 小时前 / N 天前 / YYYY-MM-DD」。 */
export function formatTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 摘要裁剪：压缩空白，按 Unicode 码点截断（不切坏 emoji），超长加省略号。 */
export function excerpt(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  if (chars.length <= max) return clean;
  return `${chars.slice(0, max).join("")}…`;
}
