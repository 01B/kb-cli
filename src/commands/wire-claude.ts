import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { createSymlink } from "../utils/symlink.js";
import { ensureGitignorePatterns } from "../utils/gitignore.js";
import type { WireContext } from "./wire.js";

function buildKbLocationContent(ctx: WireContext): string {
  return `## KB 절대 경로
LLM은 파일 접근 및 쉘 스크립트 실행 시 반드시 아래의 절대 경로를 그대로 사용할 것.
- KB 루트: ${ctx.kbPath}
- 전체 인덱스: ${ctx.kbPath}/kb-index.json
- 로컬 인덱스: ${ctx.kbPath}/.kb-index.local.json
- 로컬 인덱스 재생성 스크립트: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh
`;
}

export async function wireClaude(ctx: WireContext): Promise<void> {
  const rulesDir = path.join(ctx.projectRoot, ".claude", "rules");
  await fs.ensureDir(rulesDir);

  // 1. Symlinks to KB ai-context files
  const aiContextDir = path.join(ctx.kbPath, "ai-context");
  const symlinkTargets = [
    { name: "kb-rules.md", target: path.join(aiContextDir, "kb-rules.md") },
    { name: "team-focus.md", target: path.join(aiContextDir, "team-focus.md") },
  ];

  // Also symlink any *-overview.md files
  if (fs.existsSync(aiContextDir)) {
    const files = await fs.readdir(aiContextDir);
    for (const file of files) {
      if (file.endsWith("-overview.md")) {
        symlinkTargets.push({
          name: file,
          target: path.join(aiContextDir, file),
        });
      }
    }
  }

  for (const { name, target } of symlinkTargets) {
    await createSymlink(target, path.join(rulesDir, name));
  }

  // 3. kb-location.md — explicit paths (local-only)
  const locationPath = path.join(rulesDir, "kb-location.md");
  await fs.writeFile(locationPath, buildKbLocationContent(ctx));
  log.step("kb-location.md 생성 (KB 절대 경로)");

  // 3. .claude/settings.json
  const settingsPath = path.join(ctx.projectRoot, ".claude", "settings.json");
  if (!fs.existsSync(settingsPath)) {
    await fs.writeJson(settingsPath, {}, { spaces: 2 });
    log.step(".claude/settings.json 생성");
  }

  // 4. Update .gitignore
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".claude/rules/",
  ]);

  log.success("Claude Code 연결 완료");
}
