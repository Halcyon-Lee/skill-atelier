import type { VideoOptions } from "./options";
export type StyleExample = { title: string; hint: string; script: string; options?: Partial<VideoOptions> };
// 每个风格的「做同款」示例：点选后预填脚本与参数，用户再按自己的内容修改。
export const STYLE_EXAMPLES: Record<string, StyleExample[]> = {
  "swiss-motion": [
    { title: "新品发布预告", hint: "30 秒 · 横屏 · 明快", options: { duration: 30, pace: "fast", aspectRatio: "16:9" },
      script: "为一款名为「拾光」的笔记应用做发布预告。开头是散乱的文字与数字在网格里跳动，接着它们被逐一归类、对齐，最后组成一个清晰的界面。关键数字：3 秒记录、1 个入口、0 压力。结尾出现「让好想法，各就其位」。" },
    { title: "活动倒计时海报", hint: "18 秒 · 竖屏 · 明快", options: { duration: 18, pace: "fast", aspectRatio: "9:16" },
      script: "城市设计周即将开幕。用大号数字倒计时 10、9、8 引入，随后依次出现三个主题：街区更新、公共空间、数字生活。每个主题配一个简洁的几何图形。最后给出日期 11 月 8 日至 11 月 12 日，并写上「一起重新看见城市」。" },
    { title: "一个观点的三步论证", hint: "36 秒 · 横屏 · 标准", options: { duration: 36, pace: "normal", aspectRatio: "16:9" },
      script: "观点：好产品不是功能最多，而是让人少做决定。第一步，展示一堆选项把人淹没；第二步，选项被收敛成三个；第三步，只剩一个清晰的按钮。结尾落在一句话：少一点选择，多一点向前。" },
  ],
  "dark-keynote": [
    { title: "产品功能发布", hint: "42 秒 · 横屏 · 标准", options: { duration: 42, pace: "normal", aspectRatio: "16:9" },
      script: "发布一款智能会议助手的新功能「自动纪要」。暗色背景下，会议音波缓缓亮起，随后转写文字浮现并被提炼成三条行动项。强调三个数字：准确率 98%、生成只需 10 秒、支持 12 种语言。结尾是产品名与一句话「开完会，纪要已经好了」。" },
  ],
  "ink-wash": [
    { title: "中秋家书", hint: "48 秒 · 横屏 · 舒缓", options: { duration: 48, pace: "calm", aspectRatio: "16:9" },
      script: "中秋夜，远山如墨，一轮圆月升起。镜头缓缓掠过窗前的一盏灯与桌上的一封家书。信里写着：今年不能回家，但月亮是同一个。最后水面上月影轻轻晃动，落下一行字「千里共婵娟」。" },
  ],
  "crayon-book": [
    { title: "小狐狸学刷牙", hint: "48 秒 · 横屏 · 舒缓", options: { duration: 48, pace: "calm", aspectRatio: "16:9" },
      script: "小狐狸嘟嘟每天晚上都不想刷牙。一天夜里，牙齿小精灵来找它，带它看了蛀牙怪物怎么在牙缝里搭房子。嘟嘟害怕了，认真刷了三分钟，怪物们全被泡泡赶跑。最后嘟嘟笑着睡着了，牙齿闪闪发亮。" },
  ],
  "pixel-rpg": [
    { title: "年度成长回顾", hint: "54 秒 · 横屏 · 明快", options: { duration: 54, pace: "fast", aspectRatio: "16:9" },
      script: "像素勇者「小新」的一年：春天出发，学会了第一个技能「写代码」；夏天遇到 Boss「截止日期」，组队击败；秋天获得稀有装备「第一份 Offer」；冬天回到起点小镇，升级到 Lv.2。结尾显示「新的一年，继续冒险」。" },
  ],
};
export function getStyleExamples(slug: string): StyleExample[] { return STYLE_EXAMPLES[slug] ?? []; }
