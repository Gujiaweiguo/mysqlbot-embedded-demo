# sqlbot-embedded-demo

SQLBot 嵌入式对接 Demo，演示如何将 SQLBot 小助手以三种模式集成到宿主系统中。包含完整的前后端示例代码，开箱即用。

## 功能特性

本 Demo 支持三种小助手接入方式：

- **基础小助手** -- 加载 SQLBot 的 `assistant.js` 脚本，支持浮窗和全屏两种嵌入形态，适合快速集成
- **高级小助手** -- 数据源由宿主系统通过 API 动态提供，支持 AES 加密传输，适合需要细粒度数据源控制的场景
- **嵌入式小助手** -- 通过页面嵌入 SDK 挂载，支持问数页和数据源页，后端生成 JWT token 保证安全性

另外还支持独立的页面嵌入模式（问数 + 数据源），与嵌入式小助手使用相同的 JWT 认证链路。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3, TypeScript, Element Plus, Pinia, Vite |
| 后端 | Express, PostgreSQL, jose (JWT) |
| 测试 | Vitest (单元), Playwright (E2E) |

## 快速开始

### 前置条件

- Node.js >= 18
- PostgreSQL（需提前建好数据库，后端启动时会自动创建表结构和种子数据）
- 一个可用的 SQLBot 实例（用于实际的小助手对接）

### 安装依赖

前后端是两个独立的 npm 项目，没有根级 workspace，需要分别安装：

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 本地开发

启动后端：

```bash
cd backend && npm run dev
```

启动前端：

```bash
cd frontend && npm run dev
```

默认端口：

- 前端：`5180`
- 后端：`3100`

后端配置文件为 `backend/.env`，可修改数据库连接信息和端口号。前端开发环境下 API 请求代理到后端的 `http://localhost:3100/api`。

### 构建前端

```bash
cd frontend && npm run build
```

构建产物输出到 `frontend/dist`。生产模式下后端会直接托管该目录的静态文件，同时提供 `/api/*` 接口，形成一个完整的单端口服务。

## 项目结构

```
sqlbot-embedded-demo/
├── frontend/                # Vue 3 前端项目
│   ├── src/
│   │   ├── router/          # 路由配置（hash history + 动态路由）
│   │   ├── views/
│   │   │   ├── assistant/   # 基础小助手（浮窗 + 全屏）
│   │   │   ├── advanced/    # 高级小助手（浮窗 + 全屏）
│   │   │   ├── embedded/    # 页面嵌入（问数 + 数据源）
│   │   │   ├── assistant-embed/  # 嵌入式小助手（问数页 + 数据源页）
│   │   │   ├── setting/     # 系统设置（通用/基础/高级/嵌入式助手配置）
│   │   │   └── login/       # 登录页
│   │   ├── store/           # Pinia 状态管理
│   │   └── utils/           # 工具函数（含 request.ts 请求封装）
│   └── package.json
├── backend/                 # Express 后端项目
│   ├── controller/          # API 控制器（自动注册）
│   ├── config/              # 数据库连接池配置
│   ├── middleware/           # 请求处理中间件
│   ├── models/              # 数据模型（含启动时的表初始化）
│   ├── providers/           # 数据源 provider（GS SCRM、thxtd 等）
│   ├── server.js            # 服务入口
│   └── package.json
├── e2e/                     # Playwright E2E 测试
└── SQLBot嵌入式配置操作说明.md   # 详细配置指南
```

## 三种小助手接入方式

### 基础小助手

通过加载 SQLBot 的 `assistant.js` 脚本实现。基础应用在 SQLBot 内部管理数据源权限，宿主系统只需提供服务地址和应用 ID。

对应路由：

- `#/assistant/float` -- 浮窗嵌入
- `#/assistant/full` -- 全屏嵌入

配置入口：`#/setting/base-assistant`

### 高级小助手

数据源由宿主系统通过 `/api/datasource/` 接口动态提供，而非 SQLBot 内部管理。支持 AES 加密传输敏感字段。前端通过 iframe + postMessage 完成证书握手。

对应路由：

- `#/advanced/float` -- 浮窗嵌入
- `#/advanced/full` -- 全屏嵌入

配置入口：`#/setting/advanced-assistant`

### 嵌入式小助手

通过 SQLBot 的页面嵌入 SDK（`sqlbot_embedded_handler`）挂载，后端使用 APP ID 和 APP Secret 签发 JWT token。分为问数页和数据源页两个独立页面，各自配置 APP 凭据。

对应路由：

- `#/assistant-embed/chat` -- 问数页
- `#/assistant-embed/datasource` -- 数据源页

配置入口：`#/setting/embedded-assistant`

另外，独立的页面嵌入模式（`#/embedded/chat`、`#/embedded/ds`）也使用相同的 JWT 认证链路，凭据在通用设置中配置。

## 配置说明

完整的配置操作步骤和各模式的认证流程说明，请参阅：

[SQLBot嵌入式配置操作说明.md](./SQLBot嵌入式配置操作说明.md)

简要流程：

1. 在 SQLBot 管理端创建对应类型的应用，记录应用 ID（和 APP Secret）
2. 在本 Demo 的 `#/setting` 页面填写 SQLBot 服务地址和对应的凭据
3. 进入对应的演示页面验证嵌入效果

## 测试

单元测试（前端）：

```bash
cd frontend && npm test
```

单元测试（后端）：

```bash
cd backend && npm test
```

E2E 测试（Playwright）：

```bash
npx playwright test
```

E2E 测试默认访问 `http://localhost:5180`，可通过 `E2E_BASE_URL` 环境变量修改。

## 注意事项

- 本 Demo 的登录认证是本地演示逻辑（base64 编码的 token 匹配），不适用于生产环境
- 对接真实宿主系统时，应替换登录态获取方式、数据源接口认证方式和页面嵌入 token 生成逻辑
- 前端路由采用 hash history，菜单项根据配置动态注册，未配置对应凭据的菜单不会显示
