export const MAX_SCREENSHOTS = 3;
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type SkillScreenshot = { id: number; url: string };

export function validateShowcase(
  values: { useCases: string; exampleInput: string; exampleOutput: string },
  allowEmpty: boolean,
): Record<string, string> {
  const fields = [
    ["useCases", "使用场景", 5, 2_000],
    ["exampleInput", "任务输入", 10, 10_000],
    ["exampleOutput", "输出结果", 10, 10_000],
  ] as const;
  if (allowEmpty && fields.every(([key]) => !values[key].trim())) return {};
  const errors: Record<string, string> = {};
  for (const [key, label, min, max] of fields) {
    const length = values[key].trim().length;
    if (length < min) errors[key] = `${label}至少需要 ${min} 个字符。`;
    else if (length > max) errors[key] = `${label}不能超过 ${max.toLocaleString("en-US")} 个字符。`;
  }
  return errors;
}
