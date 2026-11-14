import { expect, open, test } from "nsh/test";
import { categoryColor, categoryLabel, excerpt, formatTime, stripHtml } from "./lib/format";
import { parseRoute, routePath } from "./lib/routes";

test("labels categories", () => {
  expect(categoryLabel("question")).toBe("求助");
  expect(categoryLabel("talk")).toBe("闲聊");
  expect(categoryLabel("unknown")).toBe("unknown");
  expect(categoryColor("creative")).toBe("#8b5cf6");
});

test("strips html into readable text", () => {
  expect(stripHtml("<p>你好<br/>世界</p>")).toBe("你好\n世界");
  expect(stripHtml("<b>加粗</b> &amp; 符号")).toBe("加粗 & 符号");
});

test("strips html and decodes entities once", () => {
  expect(stripHtml("ddd&lt;script&gt;&lt;/script&gt;")).toBe("ddd<script></script>");
  expect(stripHtml("a &lt; b and c &gt; d")).toBe("a < b and c > d");
  expect(stripHtml("a &amp; b")).toBe("a & b");
});

test("clips long excerpts", () => {
  expect(excerpt("a".repeat(200), 10)).toBe("aaaaaaaaaa…");
  expect(excerpt("  short   text  ")).toBe("short text");
});

test("formats relative time", () => {
  const now = Date.now();
  expect(formatTime(new Date(now - 30_000).toISOString())).toBe("刚刚");
  expect(formatTime(new Date(now - 5 * 60_000).toISOString())).toBe("5 分钟前");
  expect(formatTime("")).toBe("");
});

test("parses routes from web URLs and deep links", () => {
  expect(parseRoute(null)).toEqual({ name: "home", category: "" });
  expect(parseRoute("/")).toEqual({ name: "home", category: "" });
  expect(parseRoute("/?category=talk")).toEqual({ name: "home", category: "talk" });
  expect(parseRoute("/?category=unknown")).toEqual({ name: "home", category: "" });
  expect(parseRoute("/unknown/path")).toEqual({ name: "home", category: "" });
  expect(parseRoute("/posts/PS123")).toEqual({ name: "post", id: "PS123" });
  expect(parseRoute("http://127.0.0.1:8790/posts/PS123?x=1")).toEqual({
    name: "post",
    id: "PS123",
  });
  expect(parseRoute("yjlt://posts/PS 1")).toEqual({ name: "post", id: "PS 1" });
});

test("builds paths from routes", () => {
  expect(routePath({ name: "home", category: "" })).toBe("/");
  expect(routePath({ name: "home", category: "talk" })).toBe("/?category=talk");
  expect(routePath({ name: "post", id: "PS 1" })).toBe("/posts/PS%201");
});

const LIST_STUB = {
  "GET http://127.0.0.1:8090/ov2/api/posts?page=1&page_size=50": {
    body: { success: true, posts: [], page: 1, page_size: 50 },
  },
};

function postStub(id: string, title: string) {
  return {
    body: {
      success: true,
      post: {
        id,
        title,
        content: "<p>正文</p>",
        content_format: "html",
        category: "talk",
        likes: 0,
        views: 0,
        created_at: null,
        published_at: "2026-01-01T00:00:00Z",
        user_name: "测试",
        user_avatar: "",
        user_guild_name: "",
        user_guild_theme_color: "",
        user_is_leader: false,
      },
    },
  };
}

test("malformed deep links fall back to home", () => {
  expect(parseRoute("/posts/%")).toEqual({ name: "home", category: "" });
  expect(parseRoute("/posts/%zz")).toEqual({ name: "home", category: "" });
});

test("opens a post from a cold deep link", async () => {
  const app = await open("./App.tsx", {
    urlScheme: "yjlt://posts/PS1",
    network: {
      ...LIST_STUB,
      "GET http://127.0.0.1:8090/ov2/api/posts/PS1?include_comments=0": postStub(
        "PS1",
        "冷启动深链帖子",
      ),
    },
  });
  expect(app.texts()).toContain("冷启动深链帖子");
});

test("follows a deep link while running", async () => {
  const app = await open("./App.tsx", {
    network: {
      ...LIST_STUB,
      "GET http://127.0.0.1:8090/ov2/api/posts/PS2?include_comments=0": postStub(
        "PS2",
        "运行中深链帖子",
      ),
    },
  });
  await app.openWithUrl("yjlt://posts/PS2");
  expect(app.texts()).toContain("运行中深链帖子");
});

test("shows a readable error for a missing post", async () => {
  const app = await open("./App.tsx", {
    urlScheme: "yjlt://posts/MISSING",
    network: {
      ...LIST_STUB,
      "GET http://127.0.0.1:8090/ov2/api/posts/MISSING?include_comments=0": {
        status: 404,
        body: { success: false, message: "帖子不存在" },
      },
    },
  });
  expect(app.texts().join("\n")).toContain("帖子不存在");
});

test("renders the forum home", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("妖精论坛");
  expect(app.texts()).toContain("全部");
});
