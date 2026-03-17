import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { joinCommand } from "./commands/join.js";
import { wireCommand } from "./commands/wire.js";
import { doctorCommand } from "./commands/doctor.js";
import { uninstallCommand } from "./commands/uninstall.js";

const program = new Command();

program
  .name("kb")
  .description("Team Knowledge Base harness CLI")
  .version("0.1.0");

program
  .command("init")
  .description("KB 최초 생성 (팀 리드)")
  .action(initCommand);

program
  .command("join")
  .description("기존 KB에 합류 (팀원)")
  .argument("<remote-url>", "Git remote URL")
  .action(joinCommand);

program
  .command("wire")
  .description("프로젝트에 LLM 도구 연결")
  .argument("<tool>", "claude | gemini | codex")
  .action(wireCommand);

program
  .command("doctor")
  .description("KB 환경 무결성 검증")
  .action(doctorCommand);

program
  .command("uninstall")
  .description("KB wiring 제거 + 설정 정리")
  .action(uninstallCommand);

program.parse();
