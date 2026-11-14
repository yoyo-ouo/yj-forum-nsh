# yj-forum-nsh

用 [Native Shell（NSH）](https://nsh.dev) 构建的《罗小黑战记》同人论坛（妖精论坛）跨平台客户端，实验工程。

一套 TSX 跑在 NSH 的 QuickJS 运行时上，同一份代码可打包 iOS / Android / macOS / Windows / Linux（GTK 4）/ Web / 终端。

> 项目处于 0.x 阶段：NSH 本身是 0.5.1（pre-1.0），接口与构建产物都可能随上游变动。

## 现在能做什么

- 读取论坛 `/ov2/api` 的公开帖子列表（分类筛选支持中英文历史分类值合并 + 下拉刷新，单次最多 50 条）
- 点开帖子详情（标题 / 作者 / 时间 / 正文纯文本）
- 浅色 / 深色跟随系统主题

尚未做：登录、发帖、评论、图片与富文本渲染、消息中心。

## 环境

| 用途 | 依赖 |
| --- | --- |
| 类型检查 / 无头测试 / Web | 只需 `nsh` CLI |
| Linux 桌面窗口 | GTK 4.14+ 运行时（Ubuntu 26.04 自带 4.22；源码构建 Rust 模板才需要 `libgtk-4-dev clang`） |
| Android | Android SDK（platforms;android-35）、JDK、adb 设备/模拟器 |
| iOS | macOS + Xcode（iOS 15+） |

```bash
curl -fsSL https://nsh.dev/install.sh | sh   # 装到 ~/.nsh，链接 ~/.local/bin/nsh
nsh --version                                 # 0.5.1（CI 钉这个版本）
```

## 开发

```bash
make nsh-check     # 类型检查（TypeScript 7）
make nsh-test      # 无头测试
make nsh-run-web   # 浏览器预览：http://127.0.0.1:8790/
nsh run .          # 本机桌面窗口（Linux 上是 GTK）
```

首次克隆后先跑一次 `make nsh-check`：`.nsh/` 是生成物（已被 git 忽略），会重新生成类型声明与 `tsconfig` 继承目标。

## 接入的接口

前端只有一个只读 API 客户端：[lib/api.ts](lib/api.ts)。

| 项 | 值 |
| --- | --- |
| canonical base | `/ov2/api` |
| 开发 | `http://127.0.0.1:8090/ov2/api`（本机 `make dev`） |
| 生产 | `https://www.yjlt.top/ov2/api` |
| 列表 | `GET /posts?page&page_size&category` → `{success, posts[], page, page_size}`（默认拉 50 条，暂无加载更多） |
| 详情 | `GET /posts/:id?include_comments=0` → `{success, post}` |

`lib/api.ts` 顶部的 `USE_LOCAL_API` 控制地址：`true` 指本机（开发），**发版前改为 `false`**（生产 `https://www.yjlt.top/ov2/api`）。

分类筛选：历史数据里同时存在英文 key（`talk`）与中文标签（`闲聊`）。客户端一次拉取首屏（最多 50 条，后端按发布时间倒序），在本地按分类多值过滤，避免多请求打乱顺序。

### 能力声明（capabilities）

`nsh.json` 声明了最小网络权限：只允许 `GET /ov2/api`，host 为 `127.0.0.1`（http，开发）与 `www.yjlt.top`（https，生产）：

```json
"capabilities": {
  "network": {
    "http": [
      { "host": "127.0.0.1", "schemes": ["http"], "methods": ["GET"], "pathPrefixes": ["/ov2/api"] },
      { "host": "www.yjlt.top", "schemes": ["https"], "methods": ["GET"], "pathPrefixes": ["/ov2/api"] }
    ]
  }
}
```

规则：**未声明 capabilities = 全部放行；一旦声明就只允许列出的事**，对 `run` / `test` / 打包产物全部生效；嵌入宿主时宿主只能再收紧。新增接口时同步扩这条白名单，不要改成 `hosts: ["*"]`。

### Web 目标的 CORS

原生端没有 CORS；浏览器预览会走浏览器同源策略。论坛后端在非生产环境允许全部 origin（`middleware.CORS(..., AppEnv != "prod")`），所以本地 `make nsh-run-web` 可直接访问 `:8090`。部署 Web 版到生产时，需要把站点 origin 加进服务端 `CORS_ORIGINS`。

## 项目结构

```
App.tsx              入口：列表 + 详情（mount(App)）
lib/api.ts           /ov2/api 客户端与类型
lib/format.ts        分类 / 时间 / HTML 实体与去标签（纯函数，可测）
App.test.tsx         无头测试（纯函数 + 首页渲染）
nsh.json             应用元数据与 capabilities（id: top.yjlt.nsh）
Makefile             与 CI 共用的 nsh-check / nsh-test
.github/workflows/   GitHub Actions（钉 NSH_VERSION=v0.5.1）
.nsh/                生成物（类型声明、构建输出），git 忽略
```

## CI

`.github/workflows/ci.yml`：安装 `NSH_VERSION=v0.5.1` → `make nsh-check` → `make nsh-test`。两条命令都是秒级，PR 与 main 推送都会跑。

## 发布约定

- `id`：`top.yjlt.nsh`（**发布后不可修改**，改 id 等同换应用）
- `version`：语义化版本，当前 `0.1.0`
- `build`：每次签名发布 +1
- **签名私钥绝不入库**（`.gitignore` 已忽略 `keys/`、`*.secret`、`*.nshpkg`、`*.cert`）

## 许可

[CC BY-NC 4.0](LICENSE)，与论坛本体保持一致：署名、非商业使用。
