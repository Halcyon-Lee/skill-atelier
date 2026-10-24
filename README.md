# ATELIER · 私人技能档案馆

源码仓库：[github.com/Halcyon-Lee/skill-atelier](https://github.com/Halcyon-Lee/skill-atelier)

一个邀请制的 AI Agent Skills 收录站。访客必须持有有效邀请码才能注册；注册后可以浏览、搜索、收藏和收录技能。馆员拥有独立的馆务台，用于签发邀请函、管理成员与馆藏。

界面采用编辑式档案馆风格：纸张底色、衬线标题、细线与编号系统，没有通用 SaaS 模板感。

## 快速开始

需要 Node.js **22.13+**（项目使用内置 `node:sqlite`）。

```bash
git clone https://github.com/Halcyon-Lee/skill-atelier.git
cd skill-atelier
cp .env.example .env.local
# 编辑 .env.local，设置管理员密码与初始邀请码
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。首次访问会自动创建 SQLite 数据库并写入示例内容。

### 首次启动前必须配置

```dotenv
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-long-password
SEED_INVITE_CODE=YOUR-INVITE-CODE
SITE_URL=http://localhost:3000
COOKIE_SECURE=false
```

仓库**不包含** `.env.local`、真实管理员密码、初始邀请码或本地数据库。种子流程会拒绝在缺少 `ADMIN_PASSWORD` / `SEED_INVITE_CODE` 时启动。

配置完成后：

- 用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录馆员账号。
- 用 `SEED_INVITE_CODE` 在首页注册第一位新成员。
- 登录后进入 **馆务台**（头像菜单 → 馆务台），签发更多邀请函、查看成员名录、切换精选和删除档案。

> 这些凭据只在数据库第一次创建时写入。修改后再执行 `npm run db:reset` 重建数据库。

## 功能

### 邀请制准入

- 未登录访客只能看到邀请入口、登录页和注册页，技能内容完全不对外渲染。
- 注册必须携带有效邀请码；支持席位限制、到期时间与即时撤回。
- 邀请码校验在服务端完成，注册过程使用 SQLite 写事务，避免并发超发席位。
- 登录、注册和邀请码校验都有数据库持久化的频率限制。

### 技能档案

- 首页档案库：精选条目、分类筛选、关键词搜索、最新/最热/名称排序、分页。
- 全局搜索面板：`⌘K` / `Ctrl K` 打开，支持键盘上下选择，搜索标题、标签、简介和正文。
- 档案详情：Markdown 文档、版本、许可、安装命令复制、来源链接、浏览次数与收藏。
- 成员可以收录和编辑自己的技能；馆员可以编辑任意技能。
- 收藏夹、个人档案、个人资料修改与密码更新。

### 馆务台

- 签发邀请函：自定义备注、席位和有效期，生成后可直接复制邀请码或邀请链接。
- 撤回邀请函；实时显示已用席位和状态。
- 成员名录与贡献统计。
- 馆藏管理：精选开关、编辑和删除。

### 安全设计

- 密码使用 `scrypt` + 随机盐哈希，使用恒定时间比较。
- 会话是随机 256-bit 不透明 token，数据库只保存 SHA-256 摘要；Cookie 为 `HttpOnly` + `SameSite=Lax`。
- 所有写操作在 Server Action / Route Handler 内重新鉴权与授权，不依赖界面隐藏。
- 修改密码会注销该账号所有旧会话，并立即签发新会话。
- Markdown 使用 `react-markdown` 默认安全渲染，不执行原始 HTML。
- SQL 全部使用参数绑定；搜索通配符经过转义。
- 响应头包含 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy` 与 `Permissions-Policy`。

## 技术栈

- **Next.js 16.4**（App Router、Server Actions、Turbopack）
- **React 19.3**
- **TypeScript** + **Zod** 输入验证
- **Tailwind CSS 4** + 自定义设计系统
- **SQLite**（Node 内置 `node:sqlite`，零额外服务）
- **Instrument Serif + Geist**，字体随包本地加载
- **react-markdown** + **remark-gfm**

## 配置

配置位于 `.env.local`（该文件被 `.gitignore` 忽略）：

```dotenv
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-long-password
SEED_INVITE_CODE=YOUR-INVITE-CODE
SITE_URL=http://localhost:3000
COOKIE_SECURE=false
```

注意：

1. `ADMIN_PASSWORD` 与 `SEED_INVITE_CODE` 为必填项，只在**第一次建库**时生效。已建库后修改环境变量不会修改已有管理员账号。可登录后在「我的档案」里改密码；或先停服务，执行 `npm run db:reset` 后重启。
2. `.env` 中未加引号的 `#` 会被当作注释。含 `#` 的密码请写成 `ADMIN_PASSWORD="my#password"`。
3. 生产环境使用 HTTPS，并删除 `COOKIE_SECURE=false`（或设为 `true`）。
4. 可选用 `DATABASE_PATH` 指定 SQLite 文件的绝对路径。默认是 `./data/atelier.db`。

完整配置模板见 `.env.example`。

## 命令

```bash
npm run dev        # 本地开发
npm run build      # 生产构建
npm run start      # 启动生产服务
npm run lint       # ESLint
npm run typecheck  # TypeScript 检查
npm run db:reset   # 删除本地数据库（先停止服务；下次请求会重新种子）
```

## 目录结构

```text
src/
  actions/                  Server Actions：认证、技能、馆务
  app/
    (app)/                  登录后的应用区（受 requireUser 保护）
      library/              技能库
      skills/[slug]/        档案详情与编辑
      saved/                收藏夹
      submit/               收录技能
      profile/              个人档案与账户设置
      admin/                馆务台（仅馆员）
    api/                    收藏、浏览计数、搜索
    join/ login/            邀请注册与登录
    page.tsx                邀请入口
  components/               品牌、布局、技能卡片、表单、Toast 等
  lib/                      数据库、鉴权、会话、验证、查询、种子数据
data/                       SQLite 数据文件（gitignore）
scripts/reset-db.mjs        本地数据库重置脚本
```

## 数据与内容

首次启动会写入：

- 1 位馆员和 3 位示例成员
- 10 份示例技能档案（中英文 Markdown 文档）
- 12 条示例收藏
- 1 张初始邀请函

示例技能的来源链接与安装命令为演示内容，正式上线前请替换为你真实维护的技能。示例成员的密码是禁用值，无法登录；他们只用于让档案看起来完整。

## 部署提示

- 必须使用**持久化磁盘**保存 `data/atelier.db`。SQLite 不适合无状态/多实例的 Serverless 部署；推荐 VPS、Fly.io、Railway 或 Docker + volume。
- 单实例运行，定期备份 `data/atelier.db`（以及服务停止时的 `-wal` / `-shm` 文件）。
- 设置 `SITE_URL` 为真实域名，并用 HTTPS 反向代理（Caddy / Nginx）。
- 首次部署前改好 `.env` 中的管理员密码和初始邀请码。
- 目前没有邮件服务；成员忘记密码时，需要由馆员协助重置（可在服务器侧处理，或后续接入邮件找回）。

## 已验证流程

已用真实 Chromium 浏览器完整跑通：

- 无效邀请码拦截 → 有效邀请码注册 → 登录会话建立
- 全局搜索、分类浏览、技能详情
- 收藏 / 取消收藏、收藏夹
- 收录技能（中文名称自动生成拼音 slug）→ 编辑 → 删除
- 馆员登录 → 签发邀请 → 撤回邀请 → 精选切换
- 修改资料、修改密码、旧会话失效、移动端无横向溢出
- 普通成员访问馆务台会被重定向回技能库
