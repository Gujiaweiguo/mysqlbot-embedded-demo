# SQLBot 嵌入式配置操作说明

本文基于 SQLBot 官方文档《嵌入式对接》中的基础应用（`#111`）及同页相关嵌入说明整理，并结合本仓库 `sqlbot-embedded-demo` 的实际实现给出一份可执行的配置操作指南。

- 官方文档：<https://sqlbot.org/docs/v1/embedding_integration/#111>
- 当前 Demo 仓库：`sqlbot-embedded-demo`

## 1. 适用范围

本 Demo 支持三类嵌入方式：

1. **基础应用嵌入**
2. **高级应用嵌入**
3. **页面嵌入**

它们在本仓库中的对应页面如下：

- 基础应用浮窗：`frontend/src/views/assistant/float.vue`
- 基础应用全屏：`frontend/src/views/assistant/full.vue`
- 高级应用全屏：`frontend/src/views/advanced/full.vue`
- 页面嵌入：`frontend/src/views/embedded/index.vue`

## 2. 前置条件

在开始配置前，请确认以下条件满足：

### 2.1 SQLBot 侧

- 已能登录 SQLBot 管理端。
- 已准备好工作空间与可用数据源。
- 已确认宿主系统域名或访问地址，用于 SQLBot 的跨域设置。

### 2.2 Demo 系统侧

- 后端已可启动，并可访问数据库。
- 前端已可启动。
- 当前开发端口约定如下：
  - 前端：`5180`
  - 后端：`3100`

启动命令：

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

启动后访问：

- 前端页面：`http://<你的主机>:5180/`
- 后端健康检查：`http://<你的主机>:3100/health`

## 3. 在 SQLBot 中创建嵌入应用

## 3.1 基础应用

根据官方文档，使用 `admin` 登录 SQLBot 后，在**小助手应用**中创建基础应用。

需要关注的配置项：

1. **名称**
2. **描述**
3. **跨域设置**
4. **工作空间**
5. **数据源权限**

说明：

- 基础应用采用“游客 / 员工”简单权限模式。
- 游客模式只能访问“公共”数据源。

创建完成后，记录：

- **基础应用 ID**

该值将填写到本 Demo 的“基础应用 ID”字段。

## 3.2 高级应用

高级应用与基础应用的核心区别在于：**数据源通过宿主系统 API 接口提供**。

在 SQLBot 中创建高级应用时，除常规信息外，还需要重点配置：

1. **数据源接口地址**
2. **接口认证方式**
3. **是否开启 AES 加密**
4. **凭证来源与凭证目标映射**

官方文档给出的关键说明：

- SQLBot 在问数时会从宿主页面读取认证凭证。
- SQLBot 不会存储这些凭证。
- 如果宿主系统依赖 `httpOnly Cookie`，则需要额外定义一个可供接口调用的认证凭证。
- “目标凭证字段”支持 JS 表达式。

官方示例中的凭证配置：

### 源系统凭证

- 类型：`localStorage`
- 凭证名称：`sqlbot-embedded-token`

示例：

```js
var source_val = localStorage.getItem('sqlbot-embedded-token')
```

### 目标凭证

值示例：

```js
Bearer ${JSON.parse(JSON.parse(source_val).v)}
```

### 目标凭证位置

- 位置：`header`
- 名称：`sqlbot-embedded-token`

创建完成后，记录：

- **高级应用 ID**
- **是否开启 AES**
- **AES KEY**（若启用）

这些值将填写到本 Demo 的对应表单字段。

## 3.3 页面嵌入

页面嵌入在 SQLBot 中创建后，需要记录：

- **APP ID**
- **APP Secret**

官方文档强调：

- 页面嵌入所需 token 应由**后端生成**。
- 不要在前端直接暴露 `APP Secret`。

本仓库中，后端使用 `backend/controller/token.js` 生成 token，逻辑为：

- payload：`appId + account`
- secret：`embedded_app_secret`

## 4. 在 Demo 系统中填写配置

本 Demo 的系统设置页为：

- 路由：`#/setting`
- 对应文件：`frontend/src/views/setting/index.vue`

页面中需要填写的字段如下。

| 表单字段 | 含义 | 对应 SQLBot 配置 |
|---|---|---|
| SQLBot 服务地址 | SQLBot 访问域名 | 例如 `https://sqlbot.example.com` |
| 基础应用 ID | 基础应用嵌入 ID | SQLBot 基础应用创建后获得 |
| 高级应用 ID | 高级应用嵌入 ID | SQLBot 高级应用创建后获得 |
| 页面嵌入 APP ID | 页面嵌入应用 ID | SQLBot 页面嵌入创建后获得 |
| 页面嵌入 APP Secret | 页面嵌入密钥 | SQLBot 页面嵌入创建后获得 |
| API 开启 AES | 是否启用 AES 加密 | 与 SQLBot 高级应用配置保持一致 |
| API AES KEY | AES 密钥 | 启用 AES 时必填 |

推荐填写顺序：

1. 先填写 **SQLBot 服务地址**。
2. 若只验证基础应用，先填 **基础应用 ID**。
3. 若验证高级应用，再补 **高级应用 ID** 与 AES 相关字段。
4. 若验证页面嵌入，再填写 **APP ID / APP Secret**。
5. 点击“保存”。

## 5. 宿主系统与本 Demo 的实现对应关系

## 5.1 基础应用浮窗

实现文件：`frontend/src/views/assistant/float.vue`

实现方式：

- 前端按如下格式加载 SQLBot 提供的脚本：

```ts
${sqlbotDomain}/assistant.js?id=${assistantId}
```

- 在线模式下会附带：
  - `online`
  - `userFlag`

说明：

- `sqlbot_assistant_handler` 用于浮窗模式。
- 未登录时走游客模式。
- 登录后可带用户标识参与对话归属。

## 5.2 基础 / 高级应用全屏嵌入

实现文件：

- 基础应用全屏：`frontend/src/views/assistant/full.vue`
- 高级应用全屏：`frontend/src/views/advanced/full.vue`

实现方式：

- 加载：

```text
${sqlbotDomain}/xpack_static/sqlbot-embedded-dynamic.umd.js
```

- 调用：

```ts
window.sqlbot_embedded_handler.mounted(selector, param)
```

参数重点：

- `embeddedId`
- `online`
- `userFlag`（在线模式）

说明：

- 高级应用必须登录后才能正常获取宿主凭证。
- 本仓库中高级应用的 `userFlag` 取值与基础应用略有区别，见 `frontend/src/views/advanced/full.vue`。

## 5.3 页面嵌入

实现文件：`frontend/src/views/embedded/index.vue`

实现方式：

1. 前端先请求本仓库后端 `/api/token/` 获取 JWT。
2. 后端根据数据库保存的 `embedded_app_id` 与 `embedded_app_secret` 生成 token。
3. 前端调用：

```ts
window.sqlbot_embedded_handler.mounted('.embedded-full-page', { appId, token })
```

说明：

- 这是本仓库对官方文档“不要在前端暴露 app secret”的具体落地。

## 6. 高级应用 API 配置说明

本仓库内高级应用数据源接口示例实现位于：

- `backend/controller/datasource.js`

接口路径：

- `GET /api/datasource/`

返回格式：

```json
{
  "success": true,
  "code": 0,
  "data": [ ... ]
}
```

与官方文档要求一致的核心字段包括：

- `name`
- `type`
- `host`
- `port`
- `user`
- `password`
- `dataBase`
- `schema`
- `comment`
- `tables`
- `fields`

若启用 AES，本仓库会对以下字段加密：

- `host`
- `user`
- `password`
- `dataBase`
- `schema`

对应实现见：`backend/controller/datasource.js`

## 7. 登录与凭证说明

本 Demo 的登录不是标准 JWT 校验，而是本地演示逻辑：

- 前端从本地缓存中维护 `sqlbot-embedded-token`
- 后端在 `backend/middleware/requestHandler.js` 中解析该值

这意味着：

- 它适合作为嵌入流程演示
- 不适合作为生产级认证方案直接复用

如果你要对接真实宿主系统，应重点替换：

1. 宿主系统登录态获取方式
2. 高级应用数据源接口认证方式
3. 页面嵌入 token 生成与用户同步逻辑

## 8. 推荐操作流程

推荐按以下顺序完成对接：

### 8.1 基础应用最小验证

1. 在 SQLBot 中创建基础应用。
2. 配置跨域、工作空间、数据源权限。
3. 记录基础应用 ID。
4. 在 Demo 设置页填写：
   - SQLBot 服务地址
   - 基础应用 ID
5. 打开：
   - 浮窗模式
   - 全屏模式
6. 检查游客模式是否可正常问数。

### 8.2 高级应用验证

1. 在 SQLBot 中创建高级应用。
2. 配置宿主数据源接口与认证凭证规则。
3. 视需要开启 AES。
4. 在 Demo 设置页填写：
   - SQLBot 服务地址
   - 高级应用 ID
   - AES 开关与 AES KEY
5. 登录 Demo 系统。
6. 进入高级应用页面，验证是否能正常读取宿主数据源。

### 8.3 页面嵌入验证

1. 在 SQLBot 中创建页面嵌入应用。
2. 记录 APP ID 与 APP Secret。
3. 在 Demo 设置页填写：
   - 页面嵌入 APP ID
   - 页面嵌入 APP Secret
4. 进入页面嵌入页面。
5. 验证后端 token 生成是否成功，页面是否正常挂载。

## 9. 验证清单

完成配置后，建议逐项验证：

- Demo 设置页能成功保存配置。
- 基础应用浮窗能正常出现。
- 基础应用全屏能正常挂载。
- 高级应用登录后能正常问数。
- 页面嵌入能拿到后端生成的 token。
- 高级应用接口 `/api/datasource/` 返回结构符合 SQLBot 要求。
- 若启用 AES，宿主接口加密字段与 SQLBot 配置一致。

## 10. 常见问题

### 10.1 页面能打开，但嵌入区没有内容

优先检查：

- SQLBot 服务地址是否正确
- 应用 ID / APP ID 是否填写错误
- 是否存在跨域限制
- SQLBot 脚本是否成功加载

### 10.2 高级应用无法问数

优先检查：

- 是否已登录宿主系统
- `sqlbot-embedded-token` 是否存在
- SQLBot 凭证映射表达式是否正确
- 宿主接口是否真的返回 SQLBot 要求的数据源结构

### 10.3 页面嵌入失败

优先检查：

- APP ID / APP Secret 是否匹配
- 后端 `/api/token/` 是否正常返回 token
- token payload 是否包含 `appId` 与 `account`

## 11. 参考来源

- SQLBot 官方文档：<https://sqlbot.org/docs/v1/embedding_integration/#111>
- 本仓库前端设置页：`frontend/src/views/setting/index.vue`
- 本仓库页面嵌入实现：`frontend/src/views/embedded/index.vue`
- 本仓库高级应用数据源接口：`backend/controller/datasource.js`
- 本仓库页面嵌入 token 接口：`backend/controller/token.js`
