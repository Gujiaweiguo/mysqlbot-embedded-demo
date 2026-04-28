# SQLBot 嵌入式部署版配置说明（119.29.59.128）

本文是面向当前服务器环境的部署版操作说明，参数已按现有环境固定，可直接照此配置。

- 宿主 Demo 前端地址：`http://119.29.59.128:5180/`
- 宿主 Demo 后端健康检查：`http://119.29.59.128:3100/health`
- 宿主 Demo 后端 API 基址：`http://119.29.59.128:3100/api`
- SQLBot 官方文档参考：<https://sqlbot.org/docs/v1/embedding_integration/#111>

## 1. 当前环境说明

当前 `sqlbot-embedded-demo` 的关键运行参数如下：

### 1.1 前后端端口

- 前端开发服务：`5180`
- 后端服务：`3100`

前端当前已配置为：

- 监听地址：`0.0.0.0:5180`
- 外部浏览器访问地址：`http://119.29.59.128:5180/`
- 开发态 API 地址：`/api`
- Vite 代理目标：`http://127.0.0.1:3100`

因此，浏览器访问流程为：

```text
浏览器 -> http://119.29.59.128:5180/
        -> /api/* 由前端开发服务器代理到 http://127.0.0.1:3100
```

### 1.2 当前数据库连接

后端当前连接的是当前服务器上已运行的 SQLBot 开发 PostgreSQL：

- `DB_HOST=localhost`
- `DB_PORT=15432`
- `DB_NAME=sqlbot`
- `DB_USER=sqlbot_user`
- `DB_PASSWORD=DevOnly@123456`

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
http://119.29.59.128:5180/
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

### 3.3 页面嵌入

路径：**页面嵌入** -> **新建应用**

创建完成后记录：

- **APP ID**
- **APP Secret**

## 4. SQLBot 中的跨域配置怎么填

由于当前宿主页面从以下地址访问：

```text
http://119.29.59.128:5180
```

所以在 SQLBot 中配置嵌入应用时，跨域白名单至少应包含：

```text
http://119.29.59.128:5180
```

如果后续还会用其他域名或端口访问这个 Demo，也要一并加入。

## 5. 在 Demo 页面中填写系统设置

打开：

```text
http://119.29.59.128:5180/#/setting
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

## 6. 当前 Demo 的各功能访问入口

当前前端菜单下可验证以下功能：

- 系统设置：`http://119.29.59.128:5180/#/setting`
- 基础应用浮窗：菜单中“基础小助手 -> 浮窗嵌入”
- 基础应用全屏：菜单中“基础小助手 -> 全屏嵌入”
- 高级应用浮窗 / 全屏：菜单中“高级小助手”相关页面
- 页面嵌入问数：菜单中“页面嵌入 -> 问数”，对应路由 `/embedded/chat`
- 页面嵌入数据源：菜单中“页面嵌入 -> 数据源”，对应路由 `/embedded/ds`

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

## 8. 高级应用数据源接口（当前 Demo）

当前 Demo 的高级应用数据源接口是：

```text
GET http://119.29.59.128:3100/api/datasource/
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

1. 打开：`http://119.29.59.128:5180/`
2. 打开：`http://119.29.59.128:5180/#/setting`
3. 检查后端健康：`http://119.29.59.128:3100/health`

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

## 10. 当前环境下最常见的问题

### 10.1 页面打不开

优先检查：

- 前端 `npm run dev` 是否启动
- `5180` 端口是否被安全组放行
- 是否访问了正确地址：`http://119.29.59.128:5180/`

### 10.2 高级应用接口无法被 SQLBot 调用

优先检查：

- `3100` 端口是否被安全组放行
- SQLBot 侧配置的数据源接口地址是否确实填写为 `http://119.29.59.128:3100/api/datasource/`
- 后端是否正常运行，`http://119.29.59.128:3100/health` 是否可访问

### 10.3 页面能打开但嵌入内容不显示

优先检查：

- SQLBot 服务地址是否填对
- SQLBot 跨域设置是否包含 `http://119.29.59.128:5180`
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
http://119.29.59.128:5180/
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

- 宿主系统地址：`http://119.29.59.128:5180/`

### SQLBot 跨域设置

```text
http://119.29.59.128:5180
```

### Demo 系统设置页固定入口

```text
http://119.29.59.128:5180/#/setting
```

### 当前宿主系统后端地址

```text
http://119.29.59.128:3100
```

### 当前宿主系统高级应用数据源接口

```text
http://119.29.59.128:3100/api/datasource/
```

### 当前宿主系统页面嵌入 token 接口

```text
http://119.29.59.128:3100/api/token/
```
