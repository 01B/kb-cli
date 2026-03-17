import { input } from "@inquirer/prompts";
import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { saveKbPath } from "../utils/config.js";
import { cloneRepo } from "../utils/git.js";

export async function joinCommand(remoteUrl: string): Promise<void> {
  log.info("기존 KB에 합류합니다.");

  const defaultPath = path.join(process.env.HOME || "~", "team-kb");
  const kbPath = await input({
    message: "로컬 경로",
    default: defaultPath,
  });
  const resolvedPath = kbPath.startsWith("~")
    ? kbPath.replace("~", process.env.HOME || "")
    : path.resolve(kbPath);

  if (fs.existsSync(resolvedPath) && fs.readdirSync(resolvedPath).length > 0) {
    log.error(`${resolvedPath} 가 이미 존재하고 비어있지 않습니다.`);
    return;
  }

  // 1. Clone
  log.info("git clone 중...");
  await cloneRepo(remoteUrl, resolvedPath);
  log.success("clone 완료");

  // 2. Install pre-commit hook
  const hookSrc = path.join(resolvedPath, ".kb", "hooks", "pre-commit");
  const hookDest = path.join(resolvedPath, ".git", "hooks", "pre-commit");
  if (fs.existsSync(hookSrc)) {
    await fs.copy(hookSrc, hookDest);
    await fs.chmod(hookDest, 0o755);
    log.step("pre-commit hook 설치");
  } else {
    log.warn("pre-commit hook 원본이 없습니다 (.kb/hooks/pre-commit)");
  }

  // 3. Save config
  await saveKbPath(resolvedPath);

  log.success(`KB 합류 완료: ${resolvedPath}`);
  log.info("다음 단계:");
  log.step("cd ~/repos/{project} && kb wire claude (또는 gemini / codex)");
}
