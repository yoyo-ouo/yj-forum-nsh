# yj-forum-nsh

用 [Native Shell（NSH）](https://nsh.dev) 构建的 YJLT 论坛跨平台客户端实验工程。

## 这是什么

NSH 是 Longbridge 开源的跨平台原生 UI 框架（Rust 实现）：同一套 TSX（或 Rust）代码，在 iOS / Android / macOS / Windows / Linux / Web / 终端上按各平台原生方式渲染。

本工程用官方 `nsh init --template ts` 初始化，应用代码为 TSX、运行在 QuickJS 上，**不需要 Node/npm**。

## 环境

| 用途 | 依赖 |
| --- | --- |
| 类型检查 / 无头测试 / Web | 只需 `nsh` CLI |
| Linux 桌面窗口 | GTK 4.14+（Ubuntu：`sudo apt install libgtk-4-dev clang`） |
| Android | Android SDK（platforms;android-35）、JDK、adb 设备/模拟器 |
| iOS | macOS + Xcode（iOS 15+） |

安装 CLI（装到 `~/.nsh`，符号链接到 `~/.local/bin/nsh`）：

```bash
curl -fsSL https://nsh.dev/install.sh | sh
nsh --version   # 0.5.1
```

## 常用命令

在仓库根目录执行：

```bash
nsh check .                  # 类型检查（TypeScript 7，首次运行会下载 tsc）
nsh test .                   # 无头运行 App.test.tsx
nsh run .                    # 本机桌面窗口（Linux 上是 GTK）
nsh run . --target web       # 浏览器预览，默认 http://127.0.0.1:8790/
nsh package . --target web   # 打包为静态站点
```

## 项目结构

```
App.tsx         入口模块：用 mount(App) 渲染界面
App.test.tsx    无头测试（nsh test）
nsh.json        应用元数据：name / id / version / build，以及 capabilities
tsconfig.json   继承 .nsh/tsconfig.json（把 nsh 解析到 .nsh/types）
.nsh/           生成物（类型声明、构建输出），已被 .gitignore 忽略
```

## 接入论坛 API 前要做的配置

`nsh.json` 目前没有 `capabilities`——独立应用不受限制；一旦以签名包下发或嵌入宿主，
需要在 `capabilities.network` 里声明允许访问的主机：

```json
"capabilities": {
  "network": { "hosts": ["forum.example.com"] }
}
```

上线前还要把 `id`（当前 `com.example.yjforumnsh`）改成正式的应用 id。
