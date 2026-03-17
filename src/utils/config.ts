import fs from "fs-extra";
import path from "node:path";
import { log } from "./log.js";

const CONFIG_DIR = path.join(
  process.env.HOME || "~",
  ".config",
  "kb-cli",
);
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

interface KbConfig {
  kbPath: string;
}

/**
 * Read KB path from config file.
 */
export function getKbPath(): string | undefined {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config: KbConfig = fs.readJsonSync(CONFIG_PATH);
      return config.kbPath;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

/**
 * Save KB path to config file.
 */
export async function saveKbPath(kbPath: string): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_PATH, { kbPath }, { spaces: 2 });
  log.step(`설정 저장: ${CONFIG_PATH}`);
}

/**
 * Remove config file.
 */
export async function removeConfig(): Promise<boolean> {
  if (fs.existsSync(CONFIG_PATH)) {
    await fs.remove(CONFIG_PATH);
    return true;
  }
  return false;
}

export { CONFIG_PATH };
