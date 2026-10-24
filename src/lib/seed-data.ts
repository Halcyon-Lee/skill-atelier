export type SeedUser = {
  name: string;
  email: string;
  role: "admin" | "member";
  bio: string;
  avatarColor: string;
  createdAt: string;
};

export type SeedSkill = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  tags: string[];
  version: string;
  license: string;
  sourceUrl: string;
  installCommand: string;
  authorEmail: string;
  featured: boolean;
  viewCount: number;
  createdAt: string;
  description: string;
};

export const SEED_USERS: SeedUser[] = [
  {
    name: "林深",
    email: "curator@atelier.local",
    role: "admin",
    bio: "ATELIER 馆员。收集那些能把麻烦事变简单的工作方法。",
    avatarColor: "#d94f2b",
    createdAt: "2025-11-02T09:00:00.000Z",
  },
  {
    name: "Mira Chen",
    email: "mira@atelier.local",
    role: "member",
    bio: "Product engineer. 喜欢把模糊的问题拆成可以运行的界面。",
    avatarColor: "#3b5b91",
    createdAt: "2025-12-14T09:00:00.000Z",
  },
  {
    name: "周也",
    email: "zhouye@atelier.local",
    role: "member",
    bio: "研究与数据。相信好的结论都值得被追问三次。",
    avatarColor: "#4f6752",
    createdAt: "2026-01-09T09:00:00.000Z",
  },
  {
    name: "Elias Moreau",
    email: "elias@atelier.local",
    role: "member",
    bio: "Brand writer & operator. Words are interfaces too.",
    avatarColor: "#7a587d",
    createdAt: "2026-02-20T09:00:00.000Z",
  },
];

export const SEED_SKILLS: SeedSkill[] = [
  {
    slug: "code-review",
    name: "代码审阅",
    tagline: "像一位克制的资深工程师那样审阅改动，只指出真正会出问题的地方。",
    category: "engineering",
    tags: ["TypeScript", "Code Review", "Git"],
    version: "1.4.2",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill code-review",
    authorEmail: "mira@atelier.local",
    featured: true,
    viewCount: 1842,
    createdAt: "2026-07-12T10:20:00.000Z",
    description: `## 它解决什么

多数代码审阅的问题不是「看得不够多」，而是**噪音太多**。这个 Skill 让 agent 先建立改动意图，再按风险排序阅读，而不是逐行复述 diff。

## 何时使用

- PR 超过 300 行，需要快速定位高风险区域
- 上线前的最后一轮检查
- review 一个不熟悉的代码库中的改动

## 工作方式

1. 读取 PR 描述、关联 issue 与完整 diff，先写出它对意图的理解。
2. 标记涉及认证、数据迁移、并发、错误处理与边界条件的改动。
3. 对每个疑点寻找调用方和测试，确认问题可复现后才报告。
4. 用 **阻断 / 建议 / 疑问** 三档输出，每条附上最小修复建议。

## 输出格式

> **阻断** · \`src/session.ts:48\` — 过期时间使用了本地时区，服务器跨时区时会提前失效。建议改为 UTC 时间戳。

Skill 会主动抑制这些低价值评论：命名偏好、纯格式问题、没有证据的「可能有问题」。它宁愿漏掉一个小问题，也不愿用三十条噪音淹没一个真正的风险。

## 一条原则

审阅的产出不是评论数量，而是让作者更快做出正确决定。`,
  },
  {
    slug: "deep-research",
    name: "深度研究",
    tagline: "把一个开放问题拆成可验证的线索，交叉核对来源，最后给出带引用的判断。",
    category: "research",
    tags: ["Research", "Citations", "Web"],
    version: "2.1.0",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill deep-research",
    authorEmail: "zhouye@atelier.local",
    featured: false,
    viewCount: 1567,
    createdAt: "2026-07-26T08:40:00.000Z",
    description: `## 它解决什么

搜索很容易，形成判断很难。Deep Research 把「找资料」变成一条有证据链的研究流程：先定义问题，再寻找相互独立的来源，最后标出仍然不确定的部分。

## 流程

1. **界定问题**：区分事实问题、预测问题和价值问题，写出本次研究不回答什么。
2. **建立线索**：从一手资料、行业数据与反方观点三个方向并行检索。
3. **交叉验证**：至少两个独立来源支持同一结论；冲突时保留冲突，不强行调和。
4. **交付判断**：先给结论摘要，再给证据、反例和置信度。

## 适用场景

- 进入一个陌生市场前的快速扫描
- 技术选型的证据整理
- 为决策文档补齐可核验的引用

## 输出约定

每条关键结论都必须附来源链接与发布日期。无法找到来源的判断会被标记为「推测」，而不是混进事实段落。

> 好的研究不是显得知道很多，而是清楚知道哪里还不知道。`,
  },
  {
    slug: "brand-voice",
    name: "品牌语气",
    tagline: "把一段普通文案校准成品牌自己的声音：有态度，但不喧哗。",
    category: "writing",
    tags: ["Copywriting", "Tone", "Brand"],
    version: "1.2.0",
    license: "CC BY 4.0",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill brand-voice",
    authorEmail: "elias@atelier.local",
    featured: false,
    viewCount: 1120,
    createdAt: "2026-08-04T14:10:00.000Z",
    description: `## 它解决什么

品牌语气最容易在规模化的写作中流失。这个 Skill 不生成「更有创意」的句子，而是用一套可复用的判断标准，把文案拉回品牌的声音。

## 先定义，再改写

使用前提供三样材料：

- 三到五条你认为「就是我们」的既有文案
- 两条明确不想成为的反例
- 这次文案的读者与场景

Skill 会抽取句子长度、人称、幽默密度、专业术语容忍度等特征，形成一份轻量 voice sheet，再据此改写。

## 改写原则

| 保留 | 避免 |
| --- | --- |
| 具体的名词与动词 | 空泛的形容词 |
| 清晰的立场 | 讨好所有人的措辞 |
| 适度的留白 | 解释过度的句子 |

## 示例

**原文**：我们致力于通过创新的解决方案，赋能团队实现更高效的协作。

**改写**：少开一场会，把时间还给真正的工作。

改写不是变得更「文艺」，而是让句子承担它应有的信息量。`,
  },
  {
    slug: "interface-craft",
    name: "界面打磨",
    tagline: "在功能完成之后，用一套有节制的检查清单把界面从「能用」推到「想用」。",
    category: "design",
    tags: ["UI", "Design System", "Craft"],
    version: "1.6.1",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill interface-craft",
    authorEmail: "mira@atelier.local",
    featured: false,
    viewCount: 989,
    createdAt: "2026-08-15T11:30:00.000Z",
    description: `## 它解决什么

功能完成的界面往往还差最后一公里：间距不一致、层级模糊、状态缺失、动效生硬。Interface Craft 提供一轮结构化的打磨，而不是随机加圆角和阴影。

## 检查维度

1. **信息层级**：用户第一眼、第二眼、第三眼分别看到什么？
2. **间距系统**：是否存在 4px 或 8px 基准之外的随意数值？
3. **状态完整度**：空、加载、错误、成功、禁用是否都被设计过？
4. **交互反馈**：每个可点击元素是否有 hover、focus、active 与键盘可达状态？
5. **文案颗粒度**：按钮是否描述动作，而不是含糊的「确定」？

## 工作方式

先截取当前界面，按上面的维度列出问题并排序。一次只改最高影响的三项，然后重新截图对比。Skill 会拒绝无目的的整体重设计。

> 打磨的目标不是让人注意到设计，而是让人注意不到摩擦。`,
  },
  {
    slug: "sql-analyst",
    name: "SQL 分析师",
    tagline: "从模糊的业务问题出发，写出可复核的查询，并把结果翻译成人能读懂的洞察。",
    category: "data",
    tags: ["SQL", "Analytics", "Warehouse"],
    version: "1.3.0",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill sql-analyst",
    authorEmail: "zhouye@atelier.local",
    featured: false,
    viewCount: 874,
    createdAt: "2026-08-27T16:00:00.000Z",
    description: `## 它解决什么

业务问题通常不带着表结构出现。SQL Analyst 先澄清指标口径与时间范围，再检查数据质量，最后才写查询。

## 分析步骤

1. 把问题改写成一句可计算的定义：对象、时间窗、指标、维度。
2. 检查表的主键、粒度、时区与空值分布。
3. 写最小可行的查询，并与总量或已知基准对账。
4. 输出结论时同时说明分母、样本量和可能的偏差。

## 示例口径

用户问「最近转化是不是变差了」，Skill 会先拆成：

- 转化 = 哪一步到哪一步？
- 最近 = 7 天、28 天，还是同环比？
- 变差 = 绝对值下降，还是相对渠道结构变化？

## 输出约定

所有关键数字附一句口径说明。没有对照基线的「上涨 12%」不允许出现在结论里。

> 数字本身不是洞察。数字和它应该被拿来比较的东西，才是。`,
  },
  {
    slug: "meeting-notes",
    name: "会议纪要",
    tagline: "把会议记录压缩成决定、负责人和截止日期，不留下礼貌性的废话。",
    category: "productivity",
    tags: ["Meetings", "Notes", "Decisions"],
    version: "1.1.4",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill meeting-notes",
    authorEmail: "curator@atelier.local",
    featured: false,
    viewCount: 701,
    createdAt: "2026-09-03T09:15:00.000Z",
    description: `## 它解决什么

会议纪要最常见的失败，是把所有说过的话都留下来，却没有留下会后的行动。这个 Skill 只记录四类内容：决定、未决问题、行动项、风险。

## 输出结构

- **本次决定**：已经达成共识的事项与理由
- **仍待确认**：需要谁在什么时候给出答案
- **行动项**：动词开头的任务，负责人，截止日期
- **风险**：会上被提及但未展开的隐患

## 处理歧义

当讨论没有形成明确结论时，不要编造一个。写「未决」并指出分歧点，比假装达成共识更有价值。

## 一段真实示例

> **行动**：Mira 在周五前给出迁移窗口的两个备选方案。
> **未决**：旧数据是否保留只读入口，取决于法务对留存期的确认。

纪要不是会议的文字记录，而是会议之后团队共同使用的状态快照。`,
  },
  {
    slug: "launch-room",
    name: "发布指挥室",
    tagline: "把一次产品发布拆成倒计时清单：谁在什么时候必须做什么，以及什么算失败。",
    category: "growth",
    tags: ["GTM", "Launch", "Operations"],
    version: "1.0.9",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill launch-room",
    authorEmail: "elias@atelier.local",
    featured: false,
    viewCount: 646,
    createdAt: "2026-09-12T13:45:00.000Z",
    description: `## 它解决什么

发布失败往往不是因为没人努力，而是因为没有人负责「停止」。Launch Room 把发布前、发布中、发布后变成一张带明确负责人和回滚条件的作战图。

## 倒计时结构

- **T-14**：确定发布叙事、单一成功指标与对外负责人
- **T-7**：渠道素材、演示环境、客服话术冻结
- **T-2**：全员预演，检查监控与回滚路径
- **T-0**：分阶段放量，每阶段设置继续或停止的判断点
- **T+1**：复盘数据与异常，公开记录决策

## 必须提前写下的三件事

1. 什么信号出现时必须回滚？
2. 谁有权按下停止键？
3. 对外如何说明这次发布没有达到预期？

## 一条底线

如果发布计划里没有「不发布」这个选项，它就不是计划，而是决心。`,
  },
  {
    slug: "agent-evals",
    name: "智能体评测",
    tagline: "为 agent 建一套小而可信的评测集，让每次改动都有可比较的证据。",
    category: "engineering",
    tags: ["Evaluation", "LLM", "Testing"],
    version: "2.0.3",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill agent-evals",
    authorEmail: "mira@atelier.local",
    featured: false,
    viewCount: 598,
    createdAt: "2026-09-26T10:05:00.000Z",
    description: `## 它解决什么

Agent 的改动很难靠感觉判断好坏。Agent Evals 帮你从真实失败样本出发，建立一套规模很小但能指导决策的评测。

## 建评测的顺序

1. 收集 20–50 条真实输入，包含成功、失败与边界样本。
2. 为每条样本定义可检验的通过条件，而不是模糊的「回答得好」。
3. 先用当前版本跑基线，记录通过率与失败类型。
4. 每次改动只比较同一批样本，并人工复核发生漂移的个案。

## 评分分层

- **硬约束**：格式、事实、权限、禁止行为，一票否决
- **质量维度**：完整性、可执行性、语气，按 rubric 打分
- **成本维度**：延迟与 token 消耗，单独报告

## 常见陷阱

评测集一旦被用来调 prompt，就会逐渐过拟合。保留一组从未查看过的 holdout 样本，只在关键决策前运行。

> 没有评测的迭代只是在换一种方式猜。`,
  },
  {
    slug: "spec-writer",
    name: "需求规格",
    tagline: "在写第一行代码前，把模糊的想法变成边界清楚、可以被反驳的产品规格。",
    category: "productivity",
    tags: ["PRD", "Product", "Planning"],
    version: "1.2.2",
    license: "CC BY 4.0",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill spec-writer",
    authorEmail: "zhouye@atelier.local",
    featured: false,
    viewCount: 532,
    createdAt: "2026-10-05T15:20:00.000Z",
    description: `## 它解决什么

很多需求文档只是把待办列表写得更长。Spec Writer 强迫先回答三个问题：为谁解决什么问题、为什么是现在、怎样算成功。

## 一页规格

- **问题**：用户今天如何绕过这个问题？成本是什么？
- **主张**：我们相信什么变化会发生？
- **范围**：这次明确不做什么？
- **体验**：关键路径与失败状态
- **衡量**：一个主指标与两个护栏指标
- **未知**：最大的技术或行为风险

## 规则

1. 不接受「提升用户体验」作为成功标准。
2. 每个功能必须能追溯到一条用户证据。
3. 先写发布后的第一周会发生什么，再写功能细节。

## 输出之后

规格需要被挑战。Skill 会生成五个最值得在评审会上被追问的问题，而不是一份无懈可击的演示稿。

> 好的规格不是说服别人同意，而是让大家在成本最低的时候发现分歧。`,
  },
  {
    slug: "a11y-audit",
    name: "无障碍审计",
    tagline: "用键盘和读屏软件的真实路径检查界面，在发布前拦住最常见的无障碍问题。",
    category: "design",
    tags: ["Accessibility", "WCAG", "Audit"],
    version: "1.0.6",
    license: "MIT",
    sourceUrl: "https://github.com/anthropics/skills",
    installCommand: "npx skills add anthropics/skills --skill a11y-audit",
    authorEmail: "mira@atelier.local",
    featured: false,
    viewCount: 418,
    createdAt: "2026-10-15T09:50:00.000Z",
    description: `## 它解决什么

自动扫描只能发现一部分无障碍问题。这个 Skill 强制从真实使用路径出发：只用键盘、放大到 200%、打开读屏，再走一遍核心任务。

## 审计路径

1. 关闭鼠标，仅用 Tab 完成主要操作。
2. 检查焦点顺序、可见焦点与焦点陷阱。
3. 用读屏软件听取表单标签、错误提示与动态更新。
4. 放大到 200%，确认内容与操作不被裁切。
5. 检查对比度、动效偏好与表单必填提示。

## 常见高影响问题

- 用 \`div\` 做按钮，键盘无法触发
- 错误信息只靠颜色表达
- 模态框打开后焦点仍在背后页面
- 图片替代文本写成文件名

## 输出格式

按 **阻断 / 重要 / 优化** 分级，每项附复现步骤、影响的用户群体与最小修复方式。审计不是给团队增加一份待办，而是移除一扇被无意关上的门。`,
  },
];

export const SEED_BOOKMARKS: Array<{ userEmail: string; skillSlug: string }> = [
  { userEmail: "mira@atelier.local", skillSlug: "deep-research" },
  { userEmail: "mira@atelier.local", skillSlug: "brand-voice" },
  { userEmail: "mira@atelier.local", skillSlug: "sql-analyst" },
  { userEmail: "zhouye@atelier.local", skillSlug: "code-review" },
  { userEmail: "zhouye@atelier.local", skillSlug: "interface-craft" },
  { userEmail: "zhouye@atelier.local", skillSlug: "launch-room" },
  { userEmail: "elias@atelier.local", skillSlug: "code-review" },
  { userEmail: "elias@atelier.local", skillSlug: "agent-evals" },
  { userEmail: "elias@atelier.local", skillSlug: "meeting-notes" },
  { userEmail: "curator@atelier.local", skillSlug: "deep-research" },
  { userEmail: "curator@atelier.local", skillSlug: "spec-writer" },
  { userEmail: "curator@atelier.local", skillSlug: "interface-craft" },
];
