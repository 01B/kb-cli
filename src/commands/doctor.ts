import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/log.js";
import { getKbPath, CONFIG_PATH } from "../utils/config.js";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export async function doctorCommand(): Promise<void> {
  log.info("KB 환경 진단을 시작합니다.\n");
  const results: CheckResult[] = [];

  // 1. KB config
  const kbPath = getKbPath();
  results.push({
    name: `설정 파일 (${CONFIG_PATH})`,
    ok: !!kbPath,
    detail: kbPath || "미설정. kb init 또는 kb join을 먼저 실행하세요.",
  });

  if (!kbPath) {
    printResults(results);
    return;
  }

  // 2. KB directory exists and is accessible
  const kbExists = fs.existsSync(kbPath);
  results.push({
    name: "KB 디렉토리 접근",
    ok: kbExists,
    detail: kbExists ? kbPath : `${kbPath} 경로가 존재하지 않습니다.`,
  });

  if (!kbExists) {
    printResults(results);
    return;
  }

  // 3. ai-context/kb-rules.md exists
  const kbRulesPath = path.join(kbPath, "ai-context", "kb-rules.md");
  const kbRulesExists = fs.existsSync(kbRulesPath);
  results.push({
    name: "ai-context/kb-rules.md",
    ok: kbRulesExists,
    detail: kbRulesExists ? "존재" : "없음. ai-context/ 초기 파일을 작성하세요.",
  });

  // 4. kb-index.json exists
  const indexPath = path.join(kbPath, "kb-index.json");
  const indexExists = fs.existsSync(indexPath);
  results.push({
    name: "kb-index.json",
    ok: indexExists,
    detail: indexExists ? "존재" : "없음. git push 후 CI가 생성합니다.",
  });

  // 5. pre-commit hook installed
  const hookPath = path.join(kbPath, ".git", "hooks", "pre-commit");
  const hookExists = fs.existsSync(hookPath);
  results.push({
    name: "pre-commit hook",
    ok: hookExists,
    detail: hookExists ? "설치됨" : "미설치. kb join을 다시 실행하세요.",
  });

  // 6. Check project wiring (if in a project directory)
  const cwd = process.cwd();
  if (cwd !== kbPath) {
    // Claude
    const claudeRulesDir = path.join(cwd, ".claude", "rules");
    if (fs.existsSync(claudeRulesDir)) {
      const kbRulesLink = path.join(claudeRulesDir, "kb-rules.md");
      if (fs.existsSync(kbRulesLink)) {
        const stat = await fs.lstat(kbRulesLink);
        if (stat.isSymbolicLink()) {
          const target = await fs.readlink(kbRulesLink);
          const targetValid = fs.existsSync(target);
          results.push({
            name: "Claude symlink (kb-rules.md)",
            ok: targetValid,
            detail: targetValid ? `→ ${target}` : `깨진 symlink → ${target}`,
          });
        }
      }

      const locationFile = path.join(claudeRulesDir, "kb-location.md");
      results.push({
        name: "Claude kb-location.md",
        ok: fs.existsSync(locationFile),
        detail: fs.existsSync(locationFile) ? "존재" : "없음. kb wire claude를 실행하세요.",
      });
    }

    // Gemini
    const geminiImport = path.join(cwd, ".gemini", "kb-import.md");
    if (fs.existsSync(path.join(cwd, "GEMINI.md"))) {
      results.push({
        name: "Gemini kb-import.md",
        ok: fs.existsSync(geminiImport),
        detail: fs.existsSync(geminiImport) ? "존재" : "없음. kb wire gemini를 실행하세요.",
      });
    }

    // Codex
    const codexDirective = path.join(cwd, ".codex", "kb-directive.md");
    if (fs.existsSync(path.join(cwd, "AGENTS.md"))) {
      results.push({
        name: "Codex kb-directive.md",
        ok: fs.existsSync(codexDirective),
        detail: fs.existsSync(codexDirective) ? "존재" : "없음. kb wire codex를 실행하세요.",
      });
    }
  }

  printResults(results);
}

function printResults(results: CheckResult[]): void {
  let allOk = true;
  for (const r of results) {
    if (r.ok) {
      log.success(`${r.name}: ${r.detail}`);
    } else {
      log.error(`${r.name}: ${r.detail}`);
      allOk = false;
    }
  }

  console.log();
  if (allOk) {
    log.success("모든 검증 통과");
  } else {
    log.warn("일부 항목에 문제가 있습니다. 위 메시지를 확인하세요.");
  }
}
