import { CATEGORIES } from "./format";

export type Route =
  | { name: "home"; category: string }
  | { name: "post"; id: string };

export const HOME: Route = { name: "home", category: "" };

const WEB_SCHEMES = new Set(["http", "https"]);
const CATEGORY_KEYS = new Set(CATEGORIES.map((item) => item.key).filter(Boolean));

/** 把地址（完整 URL / 相对路径 / yjlt:// 深链）解析成路由。未知路径一律回首页。 */
export function parseRoute(raw: string | null): Route {
  if (!raw) return HOME;

  let path = raw;
  const match = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)(.*)$/);
  if (match) {
    const scheme = match[1].toLowerCase();
    const host = match[2] ?? "";
    const rest = match[3] || "/";
    // Web 地址只看 pathname；自定义 scheme（yjlt://posts/1）把 host 当成第一段路径。
    path = WEB_SCHEMES.has(scheme) ? rest : host ? `/${host}${rest}` : rest;
  }

  const hash = path.indexOf("#");
  if (hash >= 0) path = path.slice(0, hash);

  let query = "";
  const mark = path.indexOf("?");
  if (mark >= 0) {
    query = path.slice(mark + 1);
    path = path.slice(0, mark);
  }

  const post = path.match(/^\/posts\/([^/]+)\/?$/);
  if (post) {
    const id = decodeURIComponent(post[1]);
    if (id) return { name: "post", id };
  }

  const category = new URLSearchParams(query).get("category") ?? "";
  return { name: "home", category: CATEGORY_KEYS.has(category) ? category : "" };
}

/** 路由对应的地址（Web 上直接写进地址栏）。 */
export function routePath(route: Route): string {
  if (route.name === "post") return `/posts/${encodeURIComponent(route.id)}`;
  return route.category ? `/?category=${encodeURIComponent(route.category)}` : "/";
}

/** 错误对象转可读文本（不把 `Error: ` 前缀展示给用户）。 */
export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}
