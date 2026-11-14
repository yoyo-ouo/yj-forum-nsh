import { expect, open, test } from "nsh/test";
import { categoryColor, categoryLabel, excerpt, formatTime, stripHtml } from "./lib/format";

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

test("renders the forum home", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("妖精论坛");
  expect(app.texts()).toContain("全部");
});
