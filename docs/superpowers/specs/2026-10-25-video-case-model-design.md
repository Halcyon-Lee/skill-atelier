# 案例模型：案例、视频 Skill 与运行时

日期：2026-10-25
状态：已被取代（2026-10-25 产品转向效果展示站，见 `2026-10-25-showcase-pivot-design.md`）。保留作为记录。

## 产品方向

ATELIER 要做「视频界的 liblib」：

- 用户先浏览**视频案例**，挑一个想要的效果。
- 再在这个案例的基础上做个性化调整（脚本、通用规格、Skill 特有参数），一键「做同款」。
- 后台由平台的 Agent 运行时，调用**已经筛选好的视频 Skill** 完成生成。

在 liblib 上，用户浏览和复用的单元是「作品 + 它用的模型和参数」，而不是模型本身。所以本站的核心单元也应该是**案例**：风格和 Skill 退到案例背后，作为生成能力。

## 现状

| 方面 | 现在的实现 | 问题 |
|---|---|---|
| 入口 | 首页列出 5 种风格（`catalog/video/styles.json`），每种 1 条上游样片 | 单元是风格，不是案例 |
| 做同款示例 | `src/lib/video/examples.ts` 里写死的脚本和参数，没有对应成片 | 只有脚本，没有可看的结果 |
| 视频 Skill | 风格 = 固定版本的 `STYLE.md` + `renderer` 字段；只有 `swiss-motion` → `swiss-v1` 能生成 | 没有版本表，也没有参数定义 |
| Skill 档案库 | `skills` 表里有 35 条通用 GitHub Skill（TDD、DOCX、SEO 等） | 都不是视频 Skill，不参与生成 |
| 运行时 | worker 写死了 `job.renderer==='swiss-v1' && job.style_slug==='swiss-motion'` 才执行；心跳上报 `renderers:['swiss-v1']` | 加一个新 Skill 就要改 worker |
| 任务 | `video_jobs` 记录 `style_slug`、`style_version`（上游 commit）、`renderer`、`script`、`options_json` | 不知道这个任务是从哪个案例做的同款 |
| 收藏 | `video_favorites(user_id, style_slug)` | 收藏的是风格，不是案例 |
| 可调参数 | 只有通用的 `VideoOptions`：画幅、分辨率、时长、节奏 | Skill 不能声明自己的可调项 |

## 核心概念

```text
视频 Skill ──1:N──▶ Skill 版本（不可变）──1:N──▶ 案例 ──「做同款」──▶ 任务 ──成功──▶ 作品
                         ▲                                                     │
                         └──────────────── 任务锁定版本 ◀───────────────────────┘
                                                              作品经审核可「发布为案例」
```

- **视频 Skill**：一项可以生成视频的能力，比如「瑞士动态排版」。它只有名称、分类、状态等展示信息，本身不能直接执行。
- **Skill 版本**：真正可执行的单元。包括风格文档、执行适配器、可调参数定义、能力范围、授权署名。**发布后不能修改**，修改就发新版本。
- **案例**：一条可以浏览、可以做同款的成片，记录生成它所用的 Skill 版本、脚本和全部参数。
- **任务**：一次生成请求，是对 Skill 版本和输入的完整快照。沿用现有的 `video_jobs` 机制：幂等提交、租约、重试。
- **作品**：用户自己成功的任务。只有本人可见，通过任务页 `/works/[id]` 查看；站内没有作品列表（2026-10-25 已去掉「我的作品」页面）。以后可以在任务页申请发布成案例，形成「作品 → 案例 → 被别人做同款」的循环。

### 为什么不复用 `skills` 表

档案库里的 35 条是通用的编程和办公 Skill，没有执行适配器、参数定义和版本不可变的约束。把视频 Skill 塞进去，要么给通用 Skill 加一堆空字段，要么让 `skills` 表承担运行时的版本语义。所以**单独建 `video_skills` 表**，档案库维持现状。两者之间只保留一个可选的展示关联（`archive_skill_id`），方便以后在视频 Skill 页面上链接到对应的 Skill 档案。

> 已确认（2026-10-25）：产品定位里「已经筛选好的 skill」指的是视频风格这一类，按本节单独建表。档案库里的通用 Skill 不参与生成，所以一个任务只对应一个视频 Skill 版本。

## 数据模型

所有表都沿用现有约定：SQLite、`TEXT` ISO 时间、`*_json` 列存结构化数据，迁移在 `src/lib/video/migration.ts` 里用 `BEGIN IMMEDIATE` 包裹，并且可以重复执行。

### video_skills：视频 Skill

| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| slug | TEXT UNIQUE | 沿用现有风格 slug，如 `swiss-motion`；页面仍用 `/styles/[slug]` |
| name, english, category, description | TEXT | 来自现有 `styles.json` |
| uses | TEXT (JSON 数组) | 适用场景 |
| status | TEXT | `preview`（只展示）/ `live`（可生成）/ `retired`（下架，老案例仍可看） |
| current_version_id | INTEGER NULL | 指向当前推荐给新任务的版本 |
| archive_skill_id | INTEGER NULL → skills.id | 可选的展示关联 |
| created_by | INTEGER → users.id | 收录者 |
| created_at, updated_at | TEXT | |

### video_skill_versions：Skill 版本（不可变）

| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| skill_id | INTEGER → video_skills.id | |
| version | TEXT | 平台版本号，如 `1`、`2`；`UNIQUE(skill_id, version)` |
| source_url, source_commit | TEXT | 上游来源，对应现在的 `sourceUrl` 和 `sourceCommit` |
| style_doc_path | TEXT | 如 `catalog/video/styles/swiss-motion/STYLE.md` |
| style_doc_sha256 | TEXT | 发布时记下风格文档的哈希，worker 执行前校验，防止文档被悄悄改动 |
| adapter | TEXT | 执行适配器标识，如 `swiss-v1`；必须是运行时注册过的 |
| params_schema_json | TEXT | 这个 Skill 自己的可调参数定义，格式见下文 |
| capabilities_json | TEXT | 支持的通用规格范围，如 `{"aspectRatios":["16:9","9:16","1:1"],"resolutions":["720p","1080p"],"maxDuration":600}` |
| defaults_json | TEXT | 通用规格和 Skill 参数的默认值 |
| credit, license | TEXT | 署名与授权，对应现有字段 |
| published_at | TEXT NULL | 为空表示草稿；有值后这一行除 `retired_at` 外都不再修改 |
| retired_at | TEXT NULL | 停止接收新任务；已有任务和案例不受影响 |

现在 `video_jobs.style_version` 存的是上游 commit。新模型里，「上游 commit」和「平台版本」是两件事：同一个上游 commit 换了适配器或参数定义，也算新的平台版本。

### video_cases：案例

| 列 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK (UUID) | |
| slug | TEXT UNIQUE | 用于 `/cases/[slug]` |
| skill_version_id | INTEGER → video_skill_versions.id | 生成这条成片所用的版本 |
| origin | TEXT | `platform`（本站运行时生成）/ `upstream`（转载的上游样片） |
| job_id | TEXT NULL → video_jobs.id | `platform` 案例必填，指向产生它的任务 |
| author_id | INTEGER → users.id | 发布者；`upstream` 案例是收录者 |
| title, summary | TEXT | 展示文字；summary 写「这个案例适合做什么」 |
| script | TEXT | 做同款时预填的脚本。`upstream` 案例没有可用的原始输入，由管理员对照样片写一份「参考脚本」 |
| options_json | TEXT | 通用规格（画幅、分辨率、时长、节奏） |
| params_json | TEXT | Skill 参数取值，按版本的 `params_schema_json` 校验 |
| film_path, poster_path | TEXT | 成片和封面，见「文件存储」 |
| duration_seconds | REAL | 实际成片时长 |
| tags | TEXT (JSON 数组) | 用途、行业、画幅等，用于筛选 |
| status | TEXT | `draft` / `pending_review` / `published` / `hidden` |
| featured | INTEGER | 精选 |
| remix_count, view_count | INTEGER | 做同款次数、浏览次数 |
| credit, license | TEXT | `upstream` 案例必须填写上游署名 |
| created_at, published_at, reviewed_by | | 审核记录 |

约束：

- `origin='platform'` 时 `job_id` 不能为空，而且该任务必须是 `succeeded`，所用的 Skill 版本也必须一致。这样保证「看到的成片」确实是由这个版本、这组输入生成的。
- `origin='upstream'` 的案例**也可以做同款**，但因为成片不是本站运行时生成的，案例页和做同款表单都必须注明效果会有差异（见「案例的来源与发布」）。

### video_jobs：在现有表上增加列

| 新列 | 说明 |
|---|---|
| skill_version_id | INTEGER → video_skill_versions.id；新任务必填 |
| from_case_id | TEXT NULL → video_cases.id；从哪个案例做的同款，用于 `remix_count` 和溯源 |
| params_json | Skill 参数快照，默认 `'{}'` |

`style_slug`、`style_version`、`renderer` 暂时保留，用于兼容和回填，等所有读取方迁移完成后再删除。

### video_case_favorites：替换 video_favorites

`(user_id, case_id, created_at)`，主键 `(user_id, case_id)`。现有的风格收藏迁移成对应 Skill 的上游样片案例收藏。

## 「做同款」与参数分层

用户能调的东西分三层：

1. **脚本**：必填，10–2000 字，沿用 `validateScript`。
2. **通用规格**：沿用 `VideoOptions`。取值范围再受版本的 `capabilities_json` 限制，比如某个 Skill 只支持横屏。
3. **Skill 参数**：由版本的 `params_schema_json` 定义，创作页按定义自动生成表单。

`params_schema_json` 只支持一个很小的 JSON Schema 子集，不允许自由格式：

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "signalColor": { "type": "string", "enum": ["#E30613", "#FF5A00", "#1F3FFF", "#00A651"], "title": "信号色" },
    "density":     { "type": "integer", "minimum": 1, "maximum": 3, "title": "画面密度" },
    "closingLine": { "type": "string", "maxLength": 20, "title": "结尾标语" }
  }
}
```

- 只允许 `enum`、带范围的 `integer` 和 `number`、有长度上限的 `string`、`boolean`。服务端和 worker 用同一份校验函数，放在 `src/lib/video/params.ts`，写法参照 `parseVideoOptions`。
- 字段可以标记 `"x-locked": true`：案例展示时显示这个值，但做同款时不让改（例如某个案例的签名配色）。
- 自由文本参数（如 `closingLine`）和脚本一样，作为**数据**放进 Agent 的输入 JSON，不拼进 system prompt，延续现在「用户文本只是叙事素材」的做法。

做同款的流程：

1. 用户在 `/cases/[slug]` 点击「做同款」，创作表单预填案例的 `script`、`options_json`、`params_json`。
2. 用户修改后提交，生成的任务记录 `from_case_id`；`skill_version_id` 默认等于案例的版本。
3. 如果案例的版本已经 `retired`，就改用这个 Skill 的 `current_version_id`，并提示「效果可能与案例略有不同」。参数按新版本的 schema 重新校验，不合法的项退回默认值并提示用户。
4. 草稿仍保存在浏览器（`useVideoDraft`），键改为 `atelier-video-draft:case:<caseId>`。

现在 `examples.ts` 里的示例都是没有成片的「起手脚本」，迁移方式见下文。

## 运行时契约

把 worker 里写死的判断换成一张**适配器注册表**：

```text
scripts/video-adapters/
  index.mjs        // { 'swiss-v1': swissV1, ... }
  swiss-v1.mjs     // 由现有 video-agent.mjs + video-renderer.mjs 组合而成
```

每个适配器实现同一个接口：

```ts
type Adapter = {
  id: string;                                    // 'swiss-v1'
  check(): Promise<{ ready: boolean; message: string }>;  // 依赖检查，如 ffmpeg、字体
  plan(input: AdapterInput, ctx): Promise<Storyboard>;    // 调 Agent 编排分镜
  render(plan, ctx): Promise<{ bytes: number }>;          // 出帧、合成
};
type AdapterInput = {
  script: string; options: VideoOptions; params: Record<string, unknown>;
  styleDoc: string; skill: { slug: string; version: string };
};
```

执行流程：

1. **心跳**：worker 上报所有 `check()` 通过的适配器 ID，写入现有的 `video_worker.renderers` 列。
2. **能否提交**：网站判断一个案例或 Skill 能不能做同款，条件是：版本已发布、未下架，Skill 的状态是 `live`，并且版本的 `adapter` 在心跳上报的列表里。替代现在的 `style.renderer && runtime.renderers.includes(...)`。
3. **领取任务**：通过 `skill_version_id` 读出版本，执行前校验三件事：适配器已注册、风格文档的 sha256 一致、参数通过 schema 校验。任何一项不通过，任务就标记失败并给出明确原因，不回退到其他版本。
4. **Agent 的权限边界不变**：不能使用工具、MCP、hooks，也不保存会话，并且有预算上限。适配器拿不到数据库句柄，只能通过 ctx 回报阶段。
5. **输入快照**：`input.json` 在现有字段之外，再记录 `skillVersionId`、`adapter`、`params`、`fromCaseId`，保证可以复现。

这一节只改变「执行哪个适配器」的决定方式。现有的单 worker、单任务、租约和超时机制都不变，并发扩展另行设计。

## 案例的来源与发布

| 来源 | 谁来做 | 做同款 | 第一期 |
|---|---|---|---|
| 上游样片（LemoLab 的 5 条） | 管理员收录，并写参考脚本 | ✅ 需注明效果不同 | ✅ |
| 官方案例 | 管理员用运行时生成后发布 | ✅ | ✅ 每个 `live` Skill 至少 3 条 |
| 用户作品 | 用户在任务页点「申请发布」→ `pending_review` → 管理员在馆务台审核 | ✅ | 第二期 |

> 已确认（2026-10-25）：上游样片也要能做同款，页面上注明效果会不同。

上游样片是 LemoLab 用自己的流程制作的：Agent 生成 Canvas/WebGL 代码逐帧渲染，再配上声音。本站的适配器（如 `swiss-v1`）只做结构化分镜加 SVG 渲染，而且不带声音。所以用户从上游样片做同款，得到的成片在画面复杂度、动效和声音上都会明显不同。处理方式：

- **标注位置**：
  - 案例卡片上的标签写「参考样片」，与「本站生成」区分；
  - 案例页的成片下方固定显示说明：「这条样片由 LemoLab 制作，本站生成的同款会保留风格方向，画面细节和动效会有差异，且不含声音。」；
  - 做同款表单的提交按钮上方再提示一次。
- **可用条件**：和其他案例一样，只有所属 Skill 是 `live` 才能提交。第一期只有瑞士动态排版的样片可以真正做同款；其余 4 条显示「这个风格即将开放」，可以先保存草稿。
- **预填内容**：参考脚本由管理员写，描述样片讲了什么；通用规格取样片的画幅和时长（时长取整）；Skill 参数用版本默认值。
- **缓解落差**：同一个 Skill 下如果已经有本站生成的官方案例，案例页在说明旁边推荐它们：「想看本站实际生成效果，可以看这些案例」。

审核时要检查：脚本里有没有个人信息、侵权素材或违规内容；成片和署名是否一致。发布后，成片文件复制到公开目录，与私有的任务目录分开（见下文）。

## 文件存储

- 任务成片：仍放在私有的 `video-jobs/<jobId>/`，需要登录并且是本人才能访问，沿用现有逻辑。
- 已发布案例：复制到 `video-cases/<caseId>/film.mp4` 和 `poster.jpg`，通过 `/api/video-cases/[id]/film` 用 `streamVideo(..., { public: true })` 提供，不需要登录。
- 取消发布或隐藏案例时，只删除 `video-cases/<caseId>/`，用户原来的作品不受影响。
- 上游样片沿用现在的 `video-previews/` 和 `public/video-posters/`。
- 备份：现在的 `deploy/backup.sh` 只复制 `atelier.db`，并没有像 README 说的那样带上 `video-jobs/`。第一期要把 `video-jobs/` 和 `video-cases/` 一起纳入备份；否则恢复数据库后，案例记录还在，成片文件却没了。

## 页面与路由

| 路由 | 内容 |
|---|---|
| `/` | 案例流：精选 + 按用途、Skill、画幅筛选；卡片上悬停预览，标明「本站生成」或「参考样片」，Skill 未开放的标「即将开放」 |
| `/cases/[slug]` | 成片、所用 Skill 及版本、参数表、做同款表单、「相似案例」 |
| `/styles/[slug]` | 视频 Skill 页：介绍、上游样片、这个 Skill 下的全部案例。保留现有路由，避免和档案库的 `/skills/[slug]` 冲突 |
| `/works/[id]` | 任务页：进度、成片与下载；第二期增加「申请发布为案例」。`/works` 列表页已去掉 |
| `/favorites` | 改为收藏案例 |
| `/admin` | 馆务台增加：视频 Skill 和版本管理、案例发布、审核队列 |

## 迁移

全部写在 `migrateVideo` 里，可以重复执行，并在一个事务内完成：

1. 建表：`video_skills`、`video_skill_versions`、`video_cases`、`video_case_favorites`；给 `video_jobs` 加列。
2. 把 `styles.json` 里的 5 种风格各写成一条 `video_skills` 和一条 `version='1'` 的已发布版本：
   - `swiss-motion` 的 `adapter='swiss-v1'`、`status='live'`；
   - 其余 4 种 `status='preview'`；它们的版本在库里需要一个 adapter 标识，先填 `none`，运行时永远不会上报这个值，因此不能提交。
3. 每条上游样片生成一条 `origin='upstream'` 的已发布案例：参考脚本先写在初始化数据里，由管理员上线前补好；通用规格取样片的画幅和取整后的 `sampleDuration`。
4. 回填现有 `video_jobs.skill_version_id`：按 `style_slug` 加 `style_version` 匹配。匹配不到的历史任务保持为空，只读展示，不能重试。
5. 把 `video_favorites` 迁移到 `video_case_favorites`（指向该风格的上游样片案例），旧表保留一个版本周期后删除。
6. `examples.ts` 里的示例：`swiss-motion` 的 3 条在运行时认证可用后由管理员实际生成，作为第一批官方案例发布；其余 4 种 Skill 的示例在它们接入适配器之前不发布。`examples.ts` 在官方案例上线后删除。

`styles.json` 改为仅作为初始化数据；之后以数据库为准，`video:sync` 只负责下载样片文件。

## 分期与验收

**第一期：打通案例 → 做同款 → 运行时**

- 新建上述表并完成迁移，worker 改为通过适配器注册表执行，`swiss-v1` 的行为不变。
- 首页改为案例流；`/cases/[slug]` 支持做同款；收藏改为收藏案例。
- 馆务台可以把一个成功的任务发布为官方案例。
- `swiss-motion` 发布至少 3 条官方案例，并且都由运行时真实生成。
- 验收：从一条官方案例做同款，修改脚本和参数后提交，生成新成片。任务记录了 `from_case_id` 和 `skill_version_id`，`input.json` 能还原全部输入。测试覆盖：参数 schema 校验、版本下架后回退、适配器缺失时拒绝执行、上游案例做同款时显示差异说明、所属 Skill 未开放时不能提交。

**第二期：Skill 参数和用户作品**

- 为 `swiss-v1` 定义第一份 `params_schema_json`（如信号色、结尾标语），并且让渲染器真正使用这些参数。
- 用户作品可以申请发布，馆务台有审核队列。
- 案例页增加「相似案例」，记录做同款次数。

**第三期：更多 Skill**

- 每接入一个适配器，就有一种 Skill 从 `preview` 变成 `live`，并补齐官方案例。
- 运行时并发扩展另行设计。

## 待确认问题

1. ~~视频 Skill 和档案库的关系~~：已确认，「已筛选的 skill」指视频风格，单独建 `video_skills` 表，一个任务只对应一个 Skill 版本。
2. ~~上游样片能否做同款~~：已确认，可以做同款，页面上注明效果会不同。
3. **用户作品公开**：第二期是否开放用户发布？如果开放，是「先审后发」还是「先发后审」？本文按先审后发设计。
4. **Skill 参数由谁定义**：本文假设由平台在接入每个 Skill 时手写 schema。是否需要让 Skill 作者自行提交？
