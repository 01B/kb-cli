import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { ensureGitignorePatterns } from "../utils/gitignore.js";
import type { WireContext } from "./wire.js";

function buildAgentsMd(): string {
  return "# Knowledge Base\n- 도메인 지식 질문은 코드 탐색 전에 반드시 KB를 먼저 확인할 것\n- 세션 시작 시 반드시 .codex/kb-directive.md 파일을 먼저 읽고 그 안의 경로 지시를 따를 것\n";
}

function buildDirectiveMd(ctx: WireContext): string {
  const aiContext = path.join(ctx.kbPath, "ai-context");

  return `## KB 작동 지시
- 세션 시작 시 반드시 ${aiContext}/kb-rules.md 를 먼저 읽을 것

## KB 절대 경로
LLM은 파일 접근 및 쉘 스크립트 실행 시 반드시 아래의 절대 경로를 그대로 사용할 것.
- KB 루트: ${ctx.kbPath}
- 전체 인덱스: ${ctx.kbPath}/kb-index.json
- 로컬 인덱스: ${ctx.kbPath}/.kb-index.local.json
- 로컬 인덱스 재생성 스크립트: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh
`;
}

export async function wireCodex(ctx: WireContext): Promise<void> {
  const codexDir = path.join(ctx.projectRoot, ".codex");
  await fs.ensureDir(codexDir);

  // 1. AGENTS.md (tracked — KB directive reference only)
  const agentsMdPath = path.join(ctx.projectRoot, "AGENTS.md");
  const kbDirective = buildAgentsMd();
  if (fs.existsSync(agentsMdPath)) {
    const existing = await fs.readFile(agentsMdPath, "utf-8");
    if (!existing.includes("# Knowledge Base")) {
      await fs.appendFile(agentsMdPath, "\n" + kbDirective);
      log.step("AGENTS.md에 KB 지시문 추가");
    } else {
      log.step("AGENTS.md에 KB 지시문 이미 존재 — 스킵");
    }
  } else {
    await fs.writeFile(agentsMdPath, kbDirective);
    log.step("AGENTS.md 생성");
  }

  // 2. .codex/kb-directive.md (local-only — absolute paths)
  const directivePath = path.join(codexDir, "kb-directive.md");
  await fs.writeFile(directivePath, buildDirectiveMd(ctx));
  log.step(".codex/kb-directive.md 생성 (KB 경로 + 지시)");

  // 3. Update .gitignore
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".codex/kb-directive.md",
  ]);

  log.success("Codex CLI 연결 완료");
}
