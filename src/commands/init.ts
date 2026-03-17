import { input } from "@inquirer/prompts";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../utils/log.js";
import { renderTemplate } from "../utils/template.js";
import { saveKbPath } from "../utils/config.js";
import { initRepo } from "../utils/git.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates", "kb-structure");

const KB_DIRS = [
  "global",
  "rules",
  "analysis",
  "decisions",
  "troubleshoot",
  "drafts",
  "areas",
  "templates",
  "ai-context",
  "archive",
  "00-inbox",
  "99-personal",
  ".kb/hooks",
  ".kb/scripts",
  ".kb/setup",
  ".github/workflows",
];

export async function initCommand(): Promise<void> {
  log.info("KB 최초 생성을 시작합니다.");

  const defaultPath = path.join(process.env.HOME || "~", "team-kb");
  const kbPath = await input({
    message: "KB 경로",
    default: defaultPath,
  });
  const resolvedPath = kbPath.startsWith("~")
    ? kbPath.replace("~", process.env.HOME || "")
    : path.resolve(kbPath);

  if (fs.existsSync(resolvedPath) && fs.readdirSync(resolvedPath).length > 0) {
    log.error(`${resolvedPath} 가 이미 존재하고 비어있지 않습니다.`);
    return;
  }

  const remoteUrl = await input({
    message: "Git remote URL (없으면 엔터)",
    default: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const vars = { date: today };

  // 1. Create directory structure
  log.info("폴더 구조 생성 중...");
  for (const dir of KB_DIRS) {
    await fs.ensureDir(path.join(resolvedPath, dir));
  }
  log.success("폴더 구조 생성 완료");

  // 2. Copy .gitignore
  const gitignoreSrc = path.join(TEMPLATES_DIR, "gitignore");
  await fs.copy(gitignoreSrc, path.join(resolvedPath, ".gitignore"));
  log.step(".gitignore 생성");

  // 3. Copy and render note templates
  const noteTemplatesDir = path.join(TEMPLATES_DIR, "note-templates");
  const noteTemplates = await fs.readdir(noteTemplatesDir);
  for (const file of noteTemplates) {
    const content = await fs.readFile(path.join(noteTemplatesDir, file), "utf-8");
    const rendered = renderTemplate(content, vars);
    await fs.writeFile(path.join(resolvedPath, "templates", file), rendered);
  }
  log.step("노트 템플릿 생성");

  // 4. Copy pre-commit hook
  const preCommitSrc = path.join(TEMPLATES_DIR, "pre-commit");
  const preCommitDest = path.join(resolvedPath, ".kb", "hooks", "pre-commit");
  await fs.copy(preCommitSrc, preCommitDest);
  await fs.chmod(preCommitDest, 0o755);
  log.step("pre-commit hook 생성");

  // 5. Copy rebuild-index.sh
  const rebuildSrc = path.join(TEMPLATES_DIR, "rebuild-index.sh");
  const rebuildDest = path.join(resolvedPath, ".kb", "scripts", "rebuild-index.sh");
  await fs.copy(rebuildSrc, rebuildDest);
  await fs.chmod(rebuildDest, 0o755);
  log.step("rebuild-index.sh 생성");

  // 6. Copy GitHub Actions workflows
  const healthSrc = path.join(TEMPLATES_DIR, "kb-health.yml");
  const coverageSrc = path.join(TEMPLATES_DIR, "kb-coverage.yml");
  await fs.copy(healthSrc, path.join(resolvedPath, ".github", "workflows", "kb-health.yml"));
  await fs.copy(coverageSrc, path.join(resolvedPath, ".github", "workflows", "kb-coverage.yml"));
  log.step("GitHub Actions 워크플로우 생성");

  // 7. Create kb-index.json (empty)
  await fs.writeJson(path.join(resolvedPath, "kb-index.json"), []);
  log.step("kb-index.json 초기화 (빈 배열)");

  // 8. Create ai-context files
  const kbRulesSrc = path.join(TEMPLATES_DIR, "kb-rules.md");
  const kbRulesContent = await fs.readFile(kbRulesSrc, "utf-8");
  await fs.writeFile(
    path.join(resolvedPath, "ai-context", "kb-rules.md"),
    renderTemplate(kbRulesContent, vars),
  );

  const teamFocusSrc = path.join(TEMPLATES_DIR, "team-focus.md");
  const teamFocusContent = await fs.readFile(teamFocusSrc, "utf-8");
  await fs.writeFile(
    path.join(resolvedPath, "ai-context", "team-focus.md"),
    renderTemplate(teamFocusContent, vars),
  );
  log.step("ai-context/ 파일 생성 (kb-rules.md, team-focus.md)");

  // 9. Git init + remote
  await initRepo(resolvedPath, remoteUrl || undefined);
  log.step("git init" + (remoteUrl ? ` + remote: ${remoteUrl}` : ""));

  // 10. Install pre-commit hook
  const gitHookDest = path.join(resolvedPath, ".git", "hooks", "pre-commit");
  await fs.copy(preCommitDest, gitHookDest);
  await fs.chmod(gitHookDest, 0o755);
  log.step("pre-commit hook 설치 (.git/hooks/)");

  // 11. Save config
  await saveKbPath(resolvedPath);

  // 12. Initial commit
  const git = (await import("simple-git")).default(resolvedPath);
  await git.add(".");
  await git.commit("init: KB 구조 생성");
  log.step("초기 커밋 완료");

  log.success(`KB 생성 완료: ${resolvedPath}`);
  log.info("다음 단계:");
  log.step("ai-context/ 오버뷰 초안 작성");
  log.step("git push");
  log.step("팀원에게 kb join 안내");
}
