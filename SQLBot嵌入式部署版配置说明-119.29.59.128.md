# SQLBot 嵌入式部署版配置说明（YOUR_SERVER_IP）

本文是面向当前服务器环境的部署版操作说明，参数已按现有环境固定，可直接照此配置。

- 宿主 Demo 前端地址：`http://YOUR_SERVER_IP:5180/`
- 宿主 Demo 后端健康检查：`http://YOUR_SERVER_IP:3100/health`
- 宿主 Demo 后端 API 基址：`http://YOUR_SERVER_IP:3100/api`
- SQLBot 官方文档参考：<https://sqlbot.org/docs/v1/embedding_integration/#111>

## 1. 当前环境说明

当前 `sqlbot-embedded-demo` 的关键运行参数如下：

### 1.1 前后端端口

- 前端开发服务：`5180`
- 后端服务：`3100`

前端当前已配置为：

- 监听地址：`0.0.0.0:5180`
- 外部浏览器访问地址：`http://YOUR_SERVER_IP:5180/`
- 开发态 API 地址：`/api`
- Vite 代理目标：`http://127.0.0.1:3100`

因此，浏览器访问流程为：

```text
浏览器 -> http://YOUR_SERVER_IP:5180/
        -> /api/* 由前端开发服务器代理到 http://127.0.0.1:3100
```

### 1.2 当前数据库连接

后端当前连接的是当前服务器上已运行的 SQLBot 开发 PostgreSQL：

- `DB_HOST=localhost`
- `DB_PORT=15432`
- `DB_NAME=sqlbot`
- `DB_USER=REPLACE_WITH_YOUR_DB_USER`
- `DB_PASSWORD=REPLACE_WITH_YOUR_DB_PASSWORD`

说明：

- 该库当前是与同机 SQLBot 开发环境复用的库实例。
- 当前 Demo 启动时会在该库中创建 / 维护自己的 demo 表：
  - `setting`
  - `regions`
  - `categories`
  - `sales`

## 2. 启动方式

在服务器 `/opt/code/sqlbot-embedded-demo` 下分别启动前后端：

### 2.1 启动后端

```bash
cd /opt/code/sqlbot-embedded-demo/backend
npm run dev
```

启动成功标志：

- 日志出现：`Server is running on port 3100`
- 健康检查返回成功：

```bash
curl http://127.0.0.1:3100/health
```

### 2.2 启动前端

```bash
cd /opt/code/sqlbot-embedded-demo/frontend
npm run dev
```

启动成功标志：

- 日志出现 `Local` 与 `Network` 地址
- 对外访问应为：

```text
http://YOUR_SERVER_IP:5180/
```

## 3. 在 SQLBot 中创建嵌入应用

使用 SQLBot `admin` 账号登录后，根据需要创建以下应用。

### 3.1 基础应用

路径：**小助手应用** -> **新建基础应用**

需要填写：

1. 名称
2. 描述
3. 跨域设置
4. 工作空间
5. 数据源权限

创建完成后记录：

- **基础应用 ID**

### 3.2 高级应用

路径：**小助手应用** -> **新建高级应用**

重点配置项：

1. 数据源接口地址
2. 接口认证方式
3. 是否启用 AES
4. 凭证来源与凭证映射表达式

官方示例中的关键凭证配置可直接参考：

- 源系统凭证类型：`localStorage`
- 源系统凭证名称：`sqlbot-embedded-token`
- 目标凭证位置：`header`
- 目标凭证名称：`sqlbot-embedded-token`

目标凭证值示例：

```js
Bearer ${JSON.parse(JSON.parse(source_val).v)}
```

创建完成后记录：

- **高级应用 ID**
- **AES 是否开启**
- **AES KEY**

### 3.3 基础应用与高级应用的数据源访问配置差异

基础应用和高级应用的数据源访问机制完全不同，配置位置也不同。下面逐项说明。

#### 基础应用：在 SQLBot 基础应用设置中配置数据源访问

基础应用的数据源访问由 SQLBot 内部的工作空间与权限模型决定，配置入口在 SQLBot 管理端的**基础应用设置**页面中。

关键字段与语义：

| 字段 | 含义 |
|---|---|
| `oid` | 工作空间 ID，决定该应用归属哪个工作空间 |
| `public_list` | 公共数据源列表，控制游客模式下可访问的数据源 |

配置逻辑：

- 基础应用绑定到某个工作空间（`oid`），该工作空间下已接入的数据源决定了应用能看到的数据范围。
- `public_list` 字段用于标记哪些数据源对游客开放。未登录用户（游客）只能访问 `public_list` 中列出的数据源。
- 已登录用户（员工）可以访问该工作空间下所有已授权的数据源，不受 `public_list` 限制。

宿主系统（本 Demo）不参与基础应用的数据源配置。宿主只需提供 SQLBot 服务地址和基础应用 ID，数据源的全部权限控制在 SQLBot 侧完成。

#### 高级应用：在 SQLBot 高级应用设置 + 宿主数据源接口中配置数据源访问

高级应用的数据源不由 SQLBot 内部管理，而是由宿主系统通过 API 动态提供。配置分布在两个位置：

**位置一：SQLBot 高级应用设置页面**

需要配置以下字段，让 SQLBot 知道如何调用宿主的数据源接口：

| 字段 | 含义 |
|---|---|
| `endpoint`（数据源接口地址） | 宿主系统提供的数据源 API 地址，本环境中为 `http://YOUR_SERVER_IP:3100/api/datasource/` |
| 接口认证方式 | SQLBot 调用宿主接口时传递凭证的方式（header / cookie 等） |
| AES 开关与密钥 | 是否对数据源响应中的敏感字段做 AES 加密 |
| 凭证来源（源系统凭证） | 从宿主页面的 localStorage 等位置读取认证 token |
| 凭证目标（目标凭证） | 将源凭证转换后附加到请求 header，供宿主接口校验 |

**位置二：宿主系统数据源接口（`/api/datasource/`）**

SQLBot 在问数时会调用宿主配置的 `endpoint` 地址，宿主接口返回的数据源列表就是高级应用实际可用的数据源。本 Demo 中该接口的实现为 `backend/controller/datasource.js`。

返回结构中的每个数据源对象包含以下核心字段：

```json
{
  "name": "数据源名称",
  "type": "数据库类型",
  "host": "数据库地址",
  "port": "端口",
  "user": "用户名",
  "password": "密码",
  "dataBase": "数据库名",
  "schema": "schema",
  "comment": "备注",
  "tables": "表过滤规则",
  "fields": "字段过滤规则"
}
```

如果启用了 AES，`host`、`user`、`password`、`dataBase`、`schema` 这五个字段会被加密传输。

#### 当前 GS SCRM 环境的数据源映射

在当前 GS SCRM 环境中，SQLBot 内部的 mysqlbot 数据源记录为 `core_datasource.id = 17`。本 Demo 的 `/api/datasource/` 接口返回的正是这条记录对应的连接信息，SQLBot 拿到后会用这些信息连接实际的数据库进行问数。

如果后续需要切换数据源，修改 `core_datasource` 表中 `id = 17` 的记录即可，Demo 的 `/api/datasource/` 接口会自动读取并返回最新的连接信息。

### 3.4 页面嵌入

路径：**页面嵌入** -> **新建应用**

创建完成后记录：

- **APP ID**
- **APP Secret**

### 3.5 页面嵌入凭据的来源与运行时流程

#### 凭据从哪里获取

页面嵌入所需的三个参数全部来自 **SQLBot 管理后台**，不是本 Demo 自己生成的。

获取路径：

1. 使用 `admin` 账号登录 SQLBot 管理端。
2. 导航到 **页面嵌入 → 新建应用**。
3. SQLBot 会自动生成 **APP ID** 和 **APP Secret**。
4. 记录这两个值，然后手动填入本 Demo 的“通用设置”页面。

三个参数的含义：

| 参数 | 含义 | 示例 |
|------|------|------|
| SQLBot 服务地址 (`domain`) | SQLBot 产品的后端部署地址 | `http://YOUR_SERVER_IP:8000` |
| 页面嵌入 APP ID (`embedded_app_id`) | SQLBot 平台上注册的页面嵌入应用的唯一标识 | `f0f5803e7dbc074b` |
| 页面嵌入 APP Secret (`embedded_app_secret`) | 与 APP ID 配对的签名密钥，用于签发 JWT | （创建时 SQLBot 显示的密钥值） |

#### 运行时如何使用

页面嵌入场景的认证流程如下：

```
宿主 Demo 通用设置页 → POST /api/setting → PostgreSQL setting 表（保存凭据）
                                                    │
                                                    ▼
          嵌入页面（问数/数据源）→ GET /api/token → backend/controller/token.js
                                                    │
                                              读取 embedded_app_id
                                              读取 embedded_app_secret
                                                    │
                                         ┌──────────┴──────────┐
                                         │   生成 JWT           │
                                         │   payload: { appId } │
                                         │   签名: HS256+secret │
                                         └──────────┬──────────┘
                                                    │
                                                    ▼
          sqlbot_embedded_handler.mounted(selector, {
            appId: '<APP ID>',
            token: '<签名后的 JWT>'
          })
                                                    │
                                                    ▼
          SQLBot 服务 → 用同一份 APP Secret 验证 JWT 签名 → 验证通过后渲染嵌入界面
```

关键说明：

- **APP ID** 放入 JWT 的 payload，告诉 SQLBot "这是哪个嵌入应用"。
- **APP Secret** 用作 HS256 签名密钥。SQLBot 用自己保存的同一份 Secret 验证签名，确认请求确实来自合法宿主。APP Secret 不会出现在前端传给 SQLBot 的参数中，只有签名后的 JWT 会传递。
- **SQLBot 服务地址** 是 SQLBot 的部署地址，demo 从这里加载 JS SDK（`sqlbot-embedded-dynamic.umd.js`）和 iframe 页面。

#### 各嵌入模式的凭据使用范围

| 参数 | 页面嵌入（问数/数据源） | 基础小助手 | 高级小助手 |
|------|------------------------|-----------|-----------|
| domain（SQLBot 服务地址） | ✅ 加载 SDK | ✅ 加载 assistant.js | ✅ 加载 assistant.js |
| embedded_app_id（APP ID） | ✅ JWT payload + SDK 参数 | ❌ 不使用 | ❌ 不使用 |
| embedded_app_secret（APP Secret） | ✅ JWT 签名密钥 | ❌ 不使用 | ❌ 不使用 |

基础小助手和高级小助手走的是另一套认证路径（使用 assistant_id + demo 自身的 base64 token），不依赖页面嵌入的 APP ID / APP Secret。

## 4. SQLBot 中的跨域配置怎么填

由于当前宿主页面从以下地址访问：

```text
http://YOUR_SERVER_IP:5180
```

所以在 SQLBot 中配置嵌入应用时，跨域白名单至少应包含：

```text
http://YOUR_SERVER_IP:5180
```

如果后续还会用其他域名或端口访问这个 Demo，也要一并加入。

## 5. 在 Demo 页面中填写系统设置

打开：

```text
http://YOUR_SERVER_IP:5180/#/setting
```

在“系统设置”页面中按如下方式填写。

### 5.1 基础应用场景

| 字段 | 填写内容 |
|---|---|
| SQLBot 服务地址 | 你的 SQLBot 访问地址，例如 `https://sqlbot.example.com` |
| 基础应用 ID | SQLBot 中创建的基础应用 ID |

其余字段可暂时留空。

### 5.2 高级应用场景

| 字段 | 填写内容 |
|---|---|
| SQLBot 服务地址 | 你的 SQLBot 访问地址 |
| 高级应用 ID | SQLBot 中创建的高级应用 ID |
| API 开启 AES | 与 SQLBot 中保持一致 |
| API AES KEY | 若启用 AES，填写同一把 32 位密钥 |

### 5.3 页面嵌入场景

| 字段 | 填写内容 |
|---|---|
| SQLBot 服务地址 | 你的 SQLBot 访问地址 |
| 页面嵌入 APP ID | SQLBot 中创建的 APP ID |
| 页面嵌入 APP Secret | SQLBot 中创建的 APP Secret |

填写完成后点击“保存”。

### 5.4 嵌入式小助手场景

打开：

```text
http://YOUR_SERVER_IP:5180/#/setting/embedded-assistant
```

| 字段 | 填写内容 |
|---|---|
| 问数页 APP ID | 嵌入式小助手“问数页”使用的 APP ID（内部复用原基础应用字段） |
| 问数页 APP Secret | 对应问数页的 APP Secret |
| 数据源页 APP ID | 嵌入式小助手“数据源页”使用的 APP ID（内部复用原高级应用字段） |
| 数据源页 APP Secret | 对应数据源页的 APP Secret |

填写完成后点击“保存嵌入式小助手配置”。

## 6. 当前 Demo 的各功能访问入口

当前前端菜单下可验证以下功能：

- 系统设置：`http://YOUR_SERVER_IP:5180/#/setting`
- 基础应用浮窗：菜单中“基础小助手 -> 浮窗嵌入”
- 基础应用全屏：菜单中“基础小助手 -> 全屏嵌入”
- 高级应用浮窗 / 全屏：菜单中“高级小助手”相关页面
- 页面嵌入问数：菜单中“页面嵌入 -> 问数”，对应路由 `/embedded/chat`
- 页面嵌入数据源：菜单中“页面嵌入 -> 数据源”，对应路由 `/embedded/ds`
- 嵌入式小助手问数页：菜单中“嵌入式小助手 -> 问数页”，对应路由 `/assistant-embed/chat`
- 嵌入式小助手数据源页：菜单中“嵌入式小助手 -> 数据源页”，对应路由 `/assistant-embed/datasource`

## 7. 与当前代码实现对应的关键说明

### 7.1 基础应用浮窗

实现文件：`frontend/src/views/assistant/float.vue`

核心加载方式：

```text
${SQLBot服务地址}/assistant.js?id=${基础应用ID}
```

在线模式下还会带：

- `online`
- `userFlag`

### 7.2 基础 / 高级应用全屏嵌入

实现文件：

- `frontend/src/views/assistant/full.vue`
- `frontend/src/views/advanced/float.vue`
- `frontend/src/views/advanced/full.vue`

核心脚本：

```text
${SQLBot服务地址}/xpack_static/sqlbot-embedded-dynamic.umd.js
```

### 7.3 页面嵌入

实现文件：

- `frontend/src/views/embedded/index.vue`
- `frontend/src/views/embedded/ds.vue`

当前实现不是前端直接生成 token，而是调用后端：

- `GET /api/token/`

后端文件：`backend/controller/token.js`

说明：

- token payload 为 `appId + account`
- secret 使用设置页中保存的 `embedded_app_secret`
- 这样可以避免在前端暴露 APP Secret

### 7.4 嵌入式小助手

实现文件：

- `frontend/src/views/assistant-embed/base.vue`
- `frontend/src/views/assistant-embed/advanced.vue`

配置入口：

- `frontend/src/views/setting/embedded-assistant.vue`

说明：

- 后端仍复用 `GET /api/token/`，根据传入 `appId` 自动匹配基础应用或高级应用的嵌入凭据。
- 高级应用页面会附带 `busiFlag: 'ds'`。

## 8. 高级应用数据源接口（当前 Demo）

当前 Demo 的高级应用数据源接口是：

```text
GET http://YOUR_SERVER_IP:3100/api/datasource/
```

对应实现：`backend/controller/datasource.js`

该接口返回的数据结构用于模拟 SQLBot 官方文档要求的数据源 API。

若启用 AES，加密字段包括：

- `host`
- `user`
- `password`
- `dataBase`
- `schema`

## 9. 验证步骤

推荐按以下顺序验证：

### 9.1 基础连通性

1. 打开：`http://YOUR_SERVER_IP:5180/`
2. 打开：`http://YOUR_SERVER_IP:5180/#/setting`
3. 检查后端健康：`http://YOUR_SERVER_IP:3100/health`

### 9.2 基础应用验证

1. 在 SQLBot 中创建基础应用
2. 填写 SQLBot 服务地址与基础应用 ID
3. 打开基础应用浮窗或全屏页面
4. 确认脚本加载成功并能正常问数

### 9.3 高级应用验证

1. 在 SQLBot 中创建高级应用
2. 配好认证与 AES（如启用）
3. 登录 Demo 系统
4. 打开高级应用页面
5. 确认 SQLBot 能调用宿主系统数据源接口

### 9.4 页面嵌入验证

1. 在 SQLBot 中创建页面嵌入应用
2. 填写 APP ID / APP Secret
3. 打开页面嵌入页面
4. 确认后端 token 接口返回成功
5. 确认嵌入页面能正常加载

### 9.5 嵌入式小助手验证

1. 在 SQLBot 中分别创建小助手嵌入所需的基础应用与高级应用
2. 打开 `http://YOUR_SERVER_IP:5180/#/setting/embedded-assistant`
3. 填写两组 APP ID / APP Secret 并保存
4. 打开菜单“嵌入式小助手 -> 问数页 / 数据源页”
5. 确认两页都能成功加载嵌入内容

## 10. 当前环境下最常见的问题

### 10.1 页面打不开

优先检查：

- 前端 `npm run dev` 是否启动
- `5180` 端口是否被安全组放行
- 是否访问了正确地址：`http://YOUR_SERVER_IP:5180/`

### 10.2 高级应用接口无法被 SQLBot 调用

优先检查：

- `3100` 端口是否被安全组放行
- SQLBot 侧配置的数据源接口地址是否确实填写为 `http://YOUR_SERVER_IP:3100/api/datasource/`
- 后端是否正常运行，`http://YOUR_SERVER_IP:3100/health` 是否可访问

### 10.3 页面能打开但嵌入内容不显示

优先检查：

- SQLBot 服务地址是否填对
- SQLBot 跨域设置是否包含 `http://YOUR_SERVER_IP:5180`
- 应用 ID / APP ID / APP Secret 是否填错

### 10.4 高级应用无法问数

优先检查：

- 是否已经登录 Demo
- `sqlbot-embedded-token` 是否存在于页面存储中
- 高级应用认证表达式是否正确
- `/api/datasource/` 返回结构是否符合 SQLBot 要求

### 10.5 页面嵌入 token 失败

优先检查：

- 设置页中的 APP ID / APP Secret 是否正确
- 后端 `/api/token/` 是否可返回 token
- SQLBot 中该页面嵌入应用是否已启用

## 11. 开发态额外说明

### 11.1 当前文档对应的是开发模式

当前这份说明对应的是：

- 前端 `vite` 开发服务器
- 后端 `nodemon` 开发服务

因此：

- 前端是通过 `5180` 对外提供页面
- `/api` 是由前端开发服务器代理到本机 `3100`

### 11.2 `STATIC_DIR` 在当前开发模式下不是主要访问路径

`backend/.env` 中虽然配置了：

```text
STATIC_DIR=../frontend/dist
```

但当前使用的是前端开发服务器，所以浏览器主要访问的是：

```text
http://YOUR_SERVER_IP:5180/
```

不是后端直接托管的静态产物页面。

### 11.3 当前 `NODE_ENV=development`

后端当前运行在：

```text
NODE_ENV=development
```

这意味着出错时返回的响应里可能包含调试信息与堆栈。该模式适合当前联调，不适合作为正式生产暴露方式长期使用。

## 12. 当前部署版的直接填写模板

如果你要交给实施同学直接配置，可以按下面模板执行：

### Demo 访问地址

- 宿主系统地址：`http://YOUR_SERVER_IP:5180/`

### SQLBot 跨域设置

```text
http://YOUR_SERVER_IP:5180
```

### Demo 系统设置页固定入口

```text
http://YOUR_SERVER_IP:5180/#/setting
```

### 当前宿主系统后端地址

```text
http://YOUR_SERVER_IP:3100
```

### 当前宿主系统高级应用数据源接口

```text
http://YOUR_SERVER_IP:3100/api/datasource/
```

### 当前宿主系统页面嵌入 token 接口

```text
http://YOUR_SERVER_IP:3100/api/token/
```
