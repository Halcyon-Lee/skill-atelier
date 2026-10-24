import type { SkillScreenshot } from "@/lib/showcase-rules";

export type SkillFormInitial = {
  name: string;
  tagline: string;
  description: string;
  useCases: string;
  exampleInput: string;
  exampleOutput: string;
  screenshots: SkillScreenshot[];
  category: string;
  tags: string;
  version: string;
  license: string;
  sourceUrl: string;
  installCommand: string;
};

export function skillToFormInitial(skill: {
  name: string;
  tagline: string;
  description: string;
  useCases: string;
  exampleInput: string;
  exampleOutput: string;
  screenshots: SkillScreenshot[];
  category: string;
  tags: string[];
  version: string;
  license: string;
  sourceUrl: string | null;
  installCommand: string | null;
}): SkillFormInitial {
  return {
    name: skill.name,
    tagline: skill.tagline,
    description: skill.description,
    useCases: skill.useCases,
    exampleInput: skill.exampleInput,
    exampleOutput: skill.exampleOutput,
    screenshots: skill.screenshots,
    category: skill.category,
    tags: skill.tags.join(", "),
    version: skill.version,
    license: skill.license,
    sourceUrl: skill.sourceUrl ?? "",
    installCommand: skill.installCommand ?? "",
  };
}
