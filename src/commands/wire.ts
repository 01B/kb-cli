import { input } from "@inquirer/prompts";
import { log } from "../utils/log.js";
import { getKbPath } from "../utils/config.js";
import { wireClaude } from "./wire-claude.js";
import { wireGemini } from "./wire-gemini.js";
import { wireCodex } from "./wire-codex.js";

export interface WireContext {
  /** Absolute path to the KB repo */
  kbPath: string;
  /** Current project root (cwd) */
  projectRoot: string;
  /** Tech stack (e.g., "Spring Boot + Kotlin, Gradle") */
  techStack: string;
  /** Domain areas (e.g., "할인/쿠폰, 수수료") */
  domains: string;
  /** Current repo name (e.g., "coupon-api") */
  repoName: string;
}

async function collectWireContext(): Promise<WireContext | null> {
  // Resolve KB path
  let kbPath = getKbPath();
  if (!kbPath) {
    kbPath = await input({
      message: "KB 경로를 찾을 수 없습니다. KB 절대 경로를 입력하세요",
    });
  }

  if (!kbPath) {
    log.error("KB 경로가 필요합니다. kb init 또는 kb join을 먼저 실행하세요.");
    return null;
  }

  const projectRoot = process.cwd();
  const repoName =
    projectRoot.split("/").pop() || "unknown";

  const techStack = await input({
    message: "기술 스택",
    default: "Spring Boot + Kotlin, Gradle",
  });

  const domains = await input({
    message: "담당 도메인",
    default: "",
  });

  return { kbPath, projectRoot, techStack, domains, repoName };
}

export async function wireCommand(tool: string): Promise<void> {
  const validTools = ["claude", "gemini", "codex"];
  if (!validTools.includes(tool)) {
    log.error(`지원하지 않는 도구: ${tool}. (claude, gemini, codex 중 선택)`);
    return;
  }

  log.info(`프로젝트에 ${tool} 연결을 시작합니다.`);

  const ctx = await collectWireContext();
  if (!ctx) return;

  switch (tool) {
    case "claude":
      await wireClaude(ctx);
      break;
    case "gemini":
      await wireGemini(ctx);
      break;
    case "codex":
      await wireCodex(ctx);
      break;
  }
}
