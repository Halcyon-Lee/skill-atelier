export type CategorySlug =
  | "engineering"
  | "research"
  | "writing"
  | "design"
  | "data"
  | "productivity"
  | "growth";

export type Category = {
  slug: CategorySlug;
  label: string;
  english: string;
  color: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "engineering",
    label: "工程",
    english: "Engineering",
    color: "#4f6752",
    description: "写码、审查、测试与交付",
  },
  {
    slug: "research",
    label: "研究",
    english: "Research",
    color: "#3b5b91",
    description: "检索、验证与综述",
  },
  {
    slug: "writing",
    label: "写作",
    english: "Writing",
    color: "#9a4b2f",
    description: "语气、叙事与编辑",
  },
  {
    slug: "design",
    label: "设计",
    english: "Design",
    color: "#7a587d",
    description: "界面、系统与体验",
  },
  {
    slug: "data",
    label: "数据",
    english: "Data",
    color: "#497074",
    description: "查询、洞察与可视化",
  },
  {
    slug: "productivity",
    label: "效率",
    english: "Productivity",
    color: "#806937",
    description: "整理、决策与协作",
  },
  {
    slug: "growth",
    label: "增长",
    english: "Growth",
    color: "#913e44",
    description: "发布、营销与实验",
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.slug, category]));

export function isCategory(value: string): value is CategorySlug {
  return CATEGORY_MAP.has(value as CategorySlug);
}

export function getCategory(slug: string): Category {
  return (
    CATEGORY_MAP.get(slug as CategorySlug) ?? {
      slug: "engineering",
      label: "其他",
      english: "Misc",
      color: "#756c5e",
      description: "未分类",
    }
  );
}
