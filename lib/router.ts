import { UrlScheme, signal } from "nsh";
import { parseRoute, routePath, type Route } from "./routes";

export { HOME, errorText, parseRoute, routePath } from "./routes";
export type { Route } from "./routes";

/** 当前路由；启动时从地址栏（或深链）恢复，浏览器后退/前进时跟着变。 */
const initialRoute = parseRoute(UrlScheme.url());
export const route = signal<Route>(initialRoute);

function sameRoute(a: Route, b: Route): boolean {
  return routePath(a) === routePath(b);
}

/** 最近一次列表页的分类；从详情返回时用它恢复筛选（直接深链进入时为空）。 */
let lastHomeCategory = initialRoute.name === "home" ? initialRoute.category : "";

/** 返回列表：恢复进入详情前的分类筛选。 */
export function backToHome(): Route {
  return { name: "home", category: lastHomeCategory };
}

/** 导航：先改本地路由，再写地址（push 产生可后退的历史条目，replace 不产生）。 */
export function navigate(next: Route, replace = false): void {
  if (next.name === "home") lastHomeCategory = next.category;
  if (sameRoute(route(), next)) return;
  route.set(next);
  UrlScheme.setUrl(routePath(next), { history: replace ? "replace" : "push" });
}

// 浏览器后退/前进、手输地址：地址变了，路由跟着变。
function applyUrl(raw: string | null): void {
  try {
    const next = parseRoute(raw);
    if (next.name === "home") lastHomeCategory = next.category;
    if (!sameRoute(route(), next)) route.set(next);
  } catch {
    // 事件通道不能被畸形地址弄崩。
  }
}

UrlScheme.on("change", ({ url }) => applyUrl(url));
// `open`：原生热启动收到的深链，以及 Web 刷新后浏览器回到上一轮加载的历史条目。
UrlScheme.on("open", ({ url }) => applyUrl(url));
