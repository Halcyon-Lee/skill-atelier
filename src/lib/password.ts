import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;

  try {
    const derived = scryptSync(password, salt, KEY_LENGTH);
    const expectedBuffer = Buffer.from(expected, "hex");
    if (expectedBuffer.length !== derived.length) return false;
    return timingSafeEqual(derived, expectedBuffer);
  } catch {
    return false;
  }
}
