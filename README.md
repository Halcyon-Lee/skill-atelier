# ATELIER · AI 视频创作

一个以视频风格为入口的创作平台：浏览官方精选样片，选择风格，输入自己的脚本，在「我的作品」查看制作进度与成片。首页公开；提交制作、收藏和查看个人作品需要登录。

首期五种样片来自 [LemoLab / Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar)，保留原作者与 CC BY 4.0 署名信息。瑞士动态排版接入独立制作进程，其余四种先提供样片、草稿与收藏，待制作流程逐一验收后开放。原有 Skill 档案与管理功能保留。

## 快速开始

需要 Node.js **22.13+**（项目使用内置 `node:sqlite`）。

```bash
git clone https://github.com/Halcyon-Lee/skill-atelier.git
cd skill-atelier
cp .env.example .env.local
# 编辑 .env.local，设置管理员密码
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。首次访问会自动创建 SQLite 数据库，初始化管理员及固定邀请码。

### 首次启动前必须配置

```dotenv
ADMIN_EMAIL=admin@126.com
ADMIN_NAME=带熊猫去竹林
ADMIN_PASSWORD=your-long-password
SEED_INVITE_CODE=Leadnext2026
SITE_URL=http://localhost:3000
COOKIE_SECURE=false
```

仓库**不包含** `.env.local`、真实管理员密码或本地数据库。种子流程会拒绝在缺少 `ADMIN_PASSWORD` 时启动。

配置完成后：

- 用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录馆员账号。
- 用 `SEED_INVITE_CODE` 在首页注册第一位新成员。
- 登录后进入 **馆务台**（头像菜单 → 馆务台），签发更多邀请函、查看成员名录、切换精选和删除档案。

> 这些凭据只在数据库第一次创建时写入。修改后再执行 `npm run db:reset` 重建数据库。

## 视频制作运行

先运行网站并访问一次首页，初始化数据库。首次部署下载样片和固定版本的风格文档：

```bash
npm run video:sync
```

视频保存在数据库目录的 `video-previews/`，封面保存在 `public/video-posters/`；上游风格说明、第三方素材署名与 MIT 授权保存在 `catalog/video/`。`video:sync` 默认使用项目的 `data/`，自定义数据库目录时使用 `python3 scripts/sync-video-catalog.py --previews --data-dir /your/database/directory`。

制作进程要求本机已有 Node 22.13+、ffmpeg、ffprobe 和支持中文的系统字体（Linux 可安装 Noto CJK 字体）。画面使用可信 SVG 绘制与 sharp 渲染，无须下载大型渲染模型。首个适配器默认 **30 秒 / 1080p / 24 fps / 横屏 / 中文画面文字，不添加背景音乐或人声配音**。创作页支持以下生成参数，选择会随草稿、任务和重试保存，并实际用于编排与导出：

| 参数 | 可选值 |
|---|---|
| 画幅尺寸 | 16:9 横屏、9:16 竖屏、1:1 方形 |
| 分辨率 | 720p、1080p |
| 成片时长 | 数字输入框，单位秒；1–600 秒整数，最大 10 分钟 |
| 视频节奏 | 舒缓、标准、明快 |

分辨率按短边定义：720p 横屏为 1280×720、竖屏为 720×1280、方形为 720×720；1080p 对应 1920×1080、1080×1920、1080×1080。画面针对三种画幅分别排版。镜头数量根据输入时长自动编排，节奏影响画面运动。新生成视频不写入音频轨；旧草稿中的音乐字段会被忽略，其他设置继续保留。

Claude CLI 负责依据固定风格文档和用户脚本编排结构化分镜，禁用文件、终端、外部 MCP 与插件调用。不会执行用户脚本或 Agent 返回的代码。先完成模型认证，再启动独立 worker：

```bash
claude auth login
npm run video:worker
```

也可通过服务端环境变量 `ANTHROPIC_API_KEY` 配置 CLI 所需的 API 认证。密钥不要放进浏览器代码。可选配置：

```dotenv
VIDEO_MODEL=opus
VIDEO_MAX_BUDGET_USD=2
# VIDEO_CLAUDE_BIN=/absolute/path/to/claude
# VIDEO_FFMPEG_BIN=/absolute/path/to/ffmpeg
# VIDEO_FFPROBE_BIN=/absolute/path/to/ffprobe
```

worker 心跳和认证均正常时，创作页自动开放瑞士动态排版的提交。服务未就绪时按钮禁用并保留脚本，避免接收无法处理的任务。每位用户同时最多一个活动任务，全局单任务制作；提交幂等，任务最长 90 分钟。失去租约的运行中任务会在 worker 恢复时标记为失败，需用户手动重试，以免重复消耗模型额度。

每项任务保存在数据库及其 `video-jobs/<任务ID>/` 目录，包含脚本、分镜与最终成片。成片使用登录鉴权与 HTTP Range 流，支持拖动播放和下载；其他成员不能访问。备份时一并保存这些目录。`db:reset` 会删除视频任务及成片，保留已下载样片以免重复下载。

### 验证范围

`npm test` 包括迁移、任务幂等、单任务约束、worker 租约与恢复、阶段变更、重试、输入及视频范围请求校验。模型认证前可以用固定分镜验证渲染器；这不代表真实 Agent 已完成出片。完整闭环必须在认证后，用新脚本经 Agent 编排并生成新视频验收。

## 功能

### 邀请制准入

- 视频首页、样片与风格说明公开；制作与个人作品、原 Skill 档案需要登录。
- 注册必须携带有效邀请码；支持席位限制、到期时间与即时撤回。
- 邀请码校验在服务端完成，注册过程使用 SQLite 写事务，避免并发超发席位。
- 登录、注册和邀请码校验都有数据库持久化的频率限制。

### 技能档案

- 首页档案库：精选条目、分类筛选、关键词搜索、最新/最热/名称排序、分页。
- 全局搜索面板：`⌘K` / `Ctrl K` 打开，支持键盘上下选择，搜索标题、标签、简介和正文。
- 档案详情：Markdown 文档、版本、许可、安装命令复制、来源链接、浏览次数与收藏。
- 成员可以收录和编辑自己的技能；馆员可以编辑任意技能。
- 每份 Skill 独立展示名称、简短描述、使用场景与实现效果。实际案例采用“任务输入 → 输出结果”，支持 Markdown 和最多 3 张效果截图。
- 截图支持 PNG、JPEG、WebP 静态图片，每张最多 5 MiB、2000 万像素。服务端解码并移除图片元数据，图片仅供已登录成员访问。
- 新发布内容必须包含场景和文字案例；旧档案可保持原信息，补充案例时须一并填写场景、任务输入和输出结果。
- 技能库及全局搜索均支持匹配使用场景。
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
- **Geist Sans + Geist Mono**，字体随包本地加载
- **react-markdown** + **remark-gfm**

## 配置

配置位于 `.env.local`（该文件被 `.gitignore` 忽略）：

```dotenv
ADMIN_EMAIL=admin@126.com
ADMIN_NAME=带熊猫去竹林
ADMIN_PASSWORD=your-long-password
SEED_INVITE_CODE=Leadnext2026
SITE_URL=http://localhost:3000
COOKIE_SECURE=false
```

注意：

1. `ADMIN_PASSWORD` 为必填项；`ADMIN_NAME` 默认“带熊猫去竹林”，`SEED_INVITE_CODE` 默认 `Leadnext2026`。这些配置只在**第一次建库**时生效。已建库后修改环境变量不会修改已有管理员账号。可登录后在「我的档案」里改密码；或先停止网站和制作进程，执行 `npm run db:reset` 后重启。
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
npm test           # 场景校验、旧库迁移与图片生命周期测试
npm run catalog:import -- --dry-run # 预览 GitHub 精选内容导入
npm run catalog:import             # 导入每领域 5 个真实 GitHub Skill
npm run db:reset   # 删除本地数据库和案例截图（先停止服务；下次请求会重新种子）
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
deploy/                     服务器自动部署、备份脚本与 systemd 单元
Dockerfile                  生产镜像
docker-compose.yml          单实例应用 + 持久化 SQLite
```

## 数据与内容

已整理 2026-10-24 的 GitHub 精选快照：`catalog/github-high-star-skills-2026-10-24.json`。共 7 个领域、每领域 5 个条目，来源文件均已核对，并记录原始提交、仓库 Star 和核对时间。Star 属于整个仓库，选录结果不是各领域全站排名。输入／输出案例为说明性示例，未宣称实际运行或生成附件。

在数据库完成初始化后运行 `npm run catalog:import`，会归入 `.env.local` 配置的管理员名下；原有档案保留，重复导入跳过已有来源或标识，后续人工编辑不会被覆盖。导入条目不会附加虚构的浏览数和收藏数。技能库搜索 `GitHub精选` 可以只查看这批内容。

首次启动会写入：

- 1 位管理员，默认昵称“带熊猫去竹林”
- 固定邀请码 `Leadnext2026`，长期有效、不限使用次数；注册仍会累计使用次数

不再生成虚拟成员、演示技能或虚构收藏。运行上述导入命令后，35 份 GitHub Skill 以管理员身份收录；卡片昵称表示本站贡献者，原始作者可通过来源链接查看。

## 部署

生产形态是一个带持久化磁盘的 Docker 单实例，不能部署到 GitHub Pages，也不适合无状态 Serverless 多实例。完整服务器步骤见 [`deploy/README.md`](deploy/README.md)。

当前采用 **GitHub Actions CI/CD**：

- 每次 push / merge 到 `main`，先运行 `Verify`：install + lint + typecheck + build
- 校验通过后构建镜像并推送到 GHCR
- 通过受限 SSH 密钥部署到服务器（不能打开服务器 shell）
- 新容器健康检查通过才完成部署；失败自动回滚旧镜像
- 每日 SQLite 在线备份 + 每次部署前备份
- 旧版服务器轮询部署保留为手动 fallback，systemd timer 默认关闭

仓库需要配置一个 Actions Secret：`DEPLOY_SSH_KEY`。部署细节、服务器目录和回滚方式见 [`deploy/README.md`](deploy/README.md)。

```bash
# 上线
git push origin main
```

生产注意事项：

- 使用持久化目录保存 `data/atelier.db`，单实例运行。
- 效果截图保存在数据库目录下的 `screenshots/`，样片与视频任务分别保存在 `video-previews/` 和 `video-jobs/`；备份、迁移时应一并保留。首次启动自动迁移旧库，无需重置。
- 视频生成进程需按上方「视频制作运行」单独配置模型认证与运行依赖，再启动 worker。
- 当前通过 Docker Nginx 网关对外提供 80 端口，应用本身只监听 `127.0.0.1:3000`。
- 对外正式提供服务时使用域名 + HTTPS；中国大陆服务器需完成 ICP 备案。
- 首次部署前在服务器 `/srv/atelier/.env` 设置管理员密码、初始邀请码和 `SITE_URL`。
- 域名和 HTTPS 就绪后，将 `BIND_ADDRESS` 改为 `127.0.0.1`、`COOKIE_SECURE` 改为 `true`。
- 只给可信成员仓库 Write 权限；外部贡献者使用 fork PR，不会拿到部署密钥。
- 目前没有邮件服务；成员忘记密码时需要馆员协助重置。

## 已验证流程

已用真实 Chromium 浏览器完整跑通：

- 无效邀请码拦截 → 有效邀请码注册 → 登录会话建立
- 全局搜索、分类浏览、技能详情
- 收藏 / 取消收藏、收藏夹
- 收录技能（中文名称自动生成拼音 slug）→ 编辑 → 删除
- 馆员登录 → 签发邀请 → 撤回邀请 → 精选切换
- 修改资料、修改密码、旧会话失效、移动端无横向溢出
- 普通成员访问馆务台会被重定向回技能库
