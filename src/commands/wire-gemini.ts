import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { ensureGitignorePatterns } from "../utils/gitignore.js";
import type { WireContext } from "./wire.js";

function buildGeminiMd(): string {
  return "@.gemini/kb-import.md\n";
}

function buildKbImportMd(ctx: WireContext): string {
  const aiContext = path.join(ctx.kbPath, "ai-context");

  let content = `## KB 절대 경로
LLM은 파일 접근 및 쉘 스크립트 실행 시 반드시 아래의 절대 경로를 그대로 사용할 것.
- KB 루트: ${ctx.kbPath}
- 전체 인덱스: ${ctx.kbPath}/kb-index.json
- 로컬 인덱스: ${ctx.kbPath}/.kb-index.local.json
- 로컬 인덱스 재생성 스크립트: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh

`;

  // @import lines
  content += `@${aiContext}/kb-rules.md\n`;
  content += `@${aiContext}/team-focus.md\n`;

  // Also import any *-overview.md files
  if (fs.existsSync(aiContext)) {
    const files = fs.readdirSync(aiContext);
    for (const file of files) {
      if (file.endsWith("-overview.md")) {
        content += `@${aiContext}/${file}\n`;
      }
    }
  }

  return content;
}

export async function wireGemini(ctx: WireContext): Promise<void> {
  const geminiDir = path.join(ctx.projectRoot, ".gemini");
  await fs.ensureDir(geminiDir);

  // 1. GEMINI.md (tracked — @import only)
  const geminiMdPath = path.join(ctx.projectRoot, "GEMINI.md");
  const importLine = buildGeminiMd();
  if (fs.existsSync(geminiMdPath)) {
    const existing = await fs.readFile(geminiMdPath, "utf-8");
    if (!existing.includes("@.gemini/kb-import.md")) {
      const updated = importLine + "\n" + existing;
      await fs.writeFile(geminiMdPath, updated);
      log.step("GEMINI.md에 KB @import 추가");
    } else {
      log.step("GEMINI.md에 KB @import 이미 존재 — 스킵");
    }
  } else {
    await fs.writeFile(geminiMdPath, importLine);
    log.step("GEMINI.md 생성");
  }

  // 2. .gemini/kb-import.md (local-only — absolute paths + @imports)
  const importPath = path.join(geminiDir, "kb-import.md");
  await fs.writeFile(importPath, buildKbImportMd(ctx));
  log.step(".gemini/kb-import.md 생성 (KB 경로 + @import)");

  // 3. .gemini/settings.json
  const settingsPath = path.join(geminiDir, "settings.json");
  if (!fs.existsSync(settingsPath)) {
    await fs.writeJson(settingsPath, {}, { spaces: 2 });
    log.step(".gemini/settings.json 생성");
  }

  // 4. Update .gitignore
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".gemini/kb-import.md",
  ]);

  log.success("Gemini CLI 연결 완료");
}
