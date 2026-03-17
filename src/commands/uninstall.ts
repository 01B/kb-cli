import { confirm } from "@inquirer/prompts";
import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { getKbPath, removeConfig, CONFIG_PATH } from "../utils/config.js";

export async function uninstallCommand(): Promise<void> {
  log.info("KB wiring 제거를 시작합니다.\n");

  const cwd = process.cwd();
  let removed = 0;

  // 1. Remove Claude wiring (local-only files only)
  const claudeRulesDir = path.join(cwd, ".claude", "rules");
  if (fs.existsSync(claudeRulesDir)) {
    // Remove symlinks (KB-related only)
    const files = await fs.readdir(claudeRulesDir);
    for (const file of files) {
      const filePath = path.join(claudeRulesDir, file);
      const stat = await fs.lstat(filePath);
      if (stat.isSymbolicLink()) {
        await fs.remove(filePath);
        log.step(`symlink 삭제: .claude/rules/${file}`);
        removed++;
      }
    }

    // Remove kb-location.md
    const locationPath = path.join(claudeRulesDir, "kb-location.md");
    if (fs.existsSync(locationPath)) {
      await fs.remove(locationPath);
      log.step("삭제: .claude/rules/kb-location.md");
      removed++;
    }
  }

  // 2. Remove Gemini wiring (local-only file only)
  const geminiImport = path.join(cwd, ".gemini", "kb-import.md");
  if (fs.existsSync(geminiImport)) {
    await fs.remove(geminiImport);
    log.step("삭제: .gemini/kb-import.md");
    removed++;
  }

  // 3. Remove Codex wiring (local-only file only)
  const codexDirective = path.join(cwd, ".codex", "kb-directive.md");
  if (fs.existsSync(codexDirective)) {
    await fs.remove(codexDirective);
    log.step("삭제: .codex/kb-directive.md");
    removed++;
  }

  if (removed > 0) {
    log.success(`프로젝트 wiring ${removed}개 파일 제거 완료`);
  } else {
    log.info("현재 디렉토리에 제거할 wiring 파일이 없습니다.");
  }

  // 4. Tracked files (CLAUDE.md, GEMINI.md, AGENTS.md) — don't touch
  const trackedFiles = ["CLAUDE.md", "GEMINI.md", "AGENTS.md"].filter(
    (f) => fs.existsSync(path.join(cwd, f)),
  );
  if (trackedFiles.length > 0) {
    log.warn(
      `${trackedFiles.join(", ")}의 프로젝트 섹션은 수동으로 정리하세요 (사용자 내용과 섞여있을 수 있음).`,
    );
  }

  // 5. Remove config file
  const kbPath = getKbPath();
  const shouldRemoveConfig = await confirm({
    message: `설정 파일을 삭제할까요? (${CONFIG_PATH})`,
    default: true,
  });

  if (shouldRemoveConfig) {
    const didRemove = await removeConfig();
    if (didRemove) {
      log.step("설정 파일 삭제 완료");
    }
  }

  // 6. KB directory — ask but warn
  if (kbPath && fs.existsSync(kbPath)) {
    const shouldRemoveKb = await confirm({
      message: `KB 디렉토리를 삭제할까요? (${kbPath}) — 팀 지식이 모두 삭제됩니다!`,
      default: false,
    });

    if (shouldRemoveKb) {
      await fs.remove(kbPath);
      log.step(`KB 디렉토리 삭제: ${kbPath}`);
    } else {
      log.info(`KB 디렉토리 유지: ${kbPath}`);
    }
  }

  console.log();
  log.success("uninstall 완료");
  log.info("npm uninstall -g kb-cli 로 CLI 자체도 제거할 수 있습니다.");
}
