export type SkillFormInitial = {
  name: string;
  tagline: string;
  description: string;
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
    category: skill.category,
    tags: skill.tags.join(", "),
    version: skill.version,
    license: skill.license,
    sourceUrl: skill.sourceUrl ?? "",
    installCommand: skill.installCommand ?? "",
  };
}
