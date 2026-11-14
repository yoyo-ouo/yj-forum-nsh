// 妖精论坛 /ov2/api 客户端（只读）。
//
// 开发：本机 `make dev` 的 Go 服务（:8090）；发布前把 API_BASE 改成 https://www.yjlt.top/ov2/api。
// nsh.json 的 capabilities 已同时放行这两个 host（仅 GET /ov2/api）。

export const API_BASE = "http://127.0.0.1:8090/ov2/api";

export interface PostListItem {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  category: string;
  likes: number;
  views: number;
  comment_count: number;
  created_at: string | null;
  published_at: string;
  user_name: string;
  user_avatar: string;
  user_guild_name: string;
  user_guild_theme_color: string;
  user_is_leader: boolean;
  guild_id?: number;
  guild_name?: string;
  guild_theme_color?: string;
}

export interface PostDetail {
  id: string;
  user_id: string;
  title: string;
  content: string;
  content_format: string;
  summary?: string;
  category: string;
  likes: number;
  views: number;
  created_at: string | null;
  published_at?: string;
  user_name: string;
  user_avatar: string;
  user_guild_name: string;
  user_guild_theme_color: string;
  user_is_leader: boolean;
}

export interface PostListResult {
  posts: PostListItem[];
  page: number;
  pageSize: number;
}

interface ListResponse {
  success: boolean;
  posts?: PostListItem[];
  page?: number;
  page_size?: number;
  message?: string;
}

interface DetailResponse {
  success: boolean;
  post?: PostDetail;
  message?: string;
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchPosts(options: {
  page?: number;
  pageSize?: number;
  category?: string;
  signal?: AbortSignal;
} = {}): Promise<PostListResult> {
  const query = new URLSearchParams();
  query.set("page", String(options.page ?? 1));
  query.set("page_size", String(options.pageSize ?? 20));
  if (options.category) query.set("category", options.category);

  const data = await getJSON<ListResponse>(`/posts?${query.toString()}`, options.signal);
  if (!data.success) throw new Error(data.message || "加载失败");
  return {
    posts: data.posts ?? [],
    page: data.page ?? 1,
    pageSize: data.page_size ?? 20,
  };
}

export async function fetchPost(id: string, signal?: AbortSignal): Promise<PostDetail> {
  // include_comments=0：列表点进详情只需要正文，评论不计入首屏。
  const data = await getJSON<DetailResponse>(
    `/posts/${encodeURIComponent(id)}?include_comments=0`,
    signal,
  );
  if (!data.success || !data.post) throw new Error(data.message || "帖子不存在");
  return data.post;
}
