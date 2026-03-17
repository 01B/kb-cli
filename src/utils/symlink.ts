import fs from "fs-extra";
import path from "node:path";
import { log } from "./log.js";

/**
 * Create a symlink. If target doesn't exist, warn but still create.
 */
export async function createSymlink(
  target: string,
  linkPath: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(linkPath));

  if (fs.existsSync(linkPath)) {
    const stat = await fs.lstat(linkPath);
    if (stat.isSymbolicLink()) {
      const existing = await fs.readlink(linkPath);
      if (existing === target) {
        log.step(`symlink 이미 존재: ${path.basename(linkPath)}`);
        return;
      }
      await fs.remove(linkPath);
    } else {
      log.warn(`${linkPath} 이 일반 파일로 존재. symlink로 교체합니다.`);
      await fs.remove(linkPath);
    }
  }

  if (!fs.existsSync(target)) {
    log.warn(`symlink 대상 파일 없음: ${target} (나중에 생성 필요)`);
  }

  await fs.symlink(target, linkPath);
  log.step(`symlink 생성: ${path.basename(linkPath)} → ${target}`);
}
