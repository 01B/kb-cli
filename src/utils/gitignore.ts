import fs from "fs-extra";
import path from "node:path";
import { log } from "./log.js";

/**
 * Ensure patterns exist in a .gitignore file.
 * Creates the file if it doesn't exist. Skips patterns already present.
 */
export async function ensureGitignorePatterns(
  dir: string,
  patterns: string[],
): Promise<void> {
  const gitignorePath = path.join(dir, ".gitignore");

  let content = "";
  if (fs.existsSync(gitignorePath)) {
    content = await fs.readFile(gitignorePath, "utf-8");
  }

  const lines = content.split("\n");
  const toAdd: string[] = [];

  for (const pattern of patterns) {
    const trimmed = pattern.trim();
    if (!lines.some((line) => line.trim() === trimmed)) {
      toAdd.push(trimmed);
    }
  }

  if (toAdd.length === 0) {
    return;
  }

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  const section =
    separator +
    "\n# KB wiring (local-only)\n" +
    toAdd.join("\n") +
    "\n";

  await fs.appendFile(gitignorePath, section);
  log.step(`.gitignore에 ${toAdd.length}개 패턴 추가`);
}
