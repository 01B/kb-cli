#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/commands/init.ts
import { input } from "@inquirer/prompts";
import fs3 from "fs-extra";
import path2 from "path";
import { fileURLToPath } from "url";

// src/utils/log.ts
import pc from "picocolors";
var log = {
  info: (msg) => console.log(pc.blue("\u2139") + " " + msg),
  success: (msg) => console.log(pc.green("\u2714") + " " + msg),
  warn: (msg) => console.log(pc.yellow("\u26A0") + " " + msg),
  error: (msg) => console.error(pc.red("\u2716") + " " + msg),
  step: (msg) => console.log(pc.gray("  \u2192") + " " + msg)
};

// src/utils/template.ts
function renderTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// src/utils/config.ts
import fs from "fs-extra";
import path from "path";
var CONFIG_DIR = path.join(
  process.env.HOME || "~",
  ".config",
  "kb-cli"
);
var CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
function getKbPath() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = fs.readJsonSync(CONFIG_PATH);
      return config.kbPath;
    }
  } catch {
  }
  return void 0;
}
async function saveKbPath(kbPath) {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_PATH, { kbPath }, { spaces: 2 });
  log.step(`\uC124\uC815 \uC800\uC7A5: ${CONFIG_PATH}`);
}
async function removeConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    await fs.remove(CONFIG_PATH);
    return true;
  }
  return false;
}

// src/utils/git.ts
import simpleGit from "simple-git";
import fs2 from "fs-extra";
function getGit(cwd) {
  return simpleGit(cwd);
}
async function initRepo(dir, remote) {
  const git = getGit(dir);
  await git.init();
  if (remote) {
    await git.addRemote("origin", remote);
  }
}
async function cloneRepo(url, dir) {
  await fs2.ensureDir(dir);
  const git = simpleGit();
  await git.clone(url, dir);
}

// src/commands/init.ts
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var TEMPLATES_DIR = path2.join(__dirname, "..", "templates", "kb-structure");
var KB_DIRS = [
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
  ".github/workflows"
];
async function initCommand() {
  log.info("KB \uCD5C\uCD08 \uC0DD\uC131\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.");
  const defaultPath = path2.join(process.env.HOME || "~", "team-kb");
  const kbPath = await input({
    message: "KB \uACBD\uB85C",
    default: defaultPath
  });
  const resolvedPath = kbPath.startsWith("~") ? kbPath.replace("~", process.env.HOME || "") : path2.resolve(kbPath);
  if (fs3.existsSync(resolvedPath) && fs3.readdirSync(resolvedPath).length > 0) {
    log.error(`${resolvedPath} \uAC00 \uC774\uBBF8 \uC874\uC7AC\uD558\uACE0 \uBE44\uC5B4\uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`);
    return;
  }
  const remoteUrl = await input({
    message: "Git remote URL (\uC5C6\uC73C\uBA74 \uC5D4\uD130)",
    default: ""
  });
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const vars = { date: today };
  log.info("\uD3F4\uB354 \uAD6C\uC870 \uC0DD\uC131 \uC911...");
  for (const dir of KB_DIRS) {
    await fs3.ensureDir(path2.join(resolvedPath, dir));
  }
  log.success("\uD3F4\uB354 \uAD6C\uC870 \uC0DD\uC131 \uC644\uB8CC");
  const gitignoreSrc = path2.join(TEMPLATES_DIR, "gitignore");
  await fs3.copy(gitignoreSrc, path2.join(resolvedPath, ".gitignore"));
  log.step(".gitignore \uC0DD\uC131");
  const noteTemplatesDir = path2.join(TEMPLATES_DIR, "note-templates");
  const noteTemplates = await fs3.readdir(noteTemplatesDir);
  for (const file of noteTemplates) {
    const content = await fs3.readFile(path2.join(noteTemplatesDir, file), "utf-8");
    const rendered = renderTemplate(content, vars);
    await fs3.writeFile(path2.join(resolvedPath, "templates", file), rendered);
  }
  log.step("\uB178\uD2B8 \uD15C\uD50C\uB9BF \uC0DD\uC131");
  const preCommitSrc = path2.join(TEMPLATES_DIR, "pre-commit");
  const preCommitDest = path2.join(resolvedPath, ".kb", "hooks", "pre-commit");
  await fs3.copy(preCommitSrc, preCommitDest);
  await fs3.chmod(preCommitDest, 493);
  log.step("pre-commit hook \uC0DD\uC131");
  const rebuildSrc = path2.join(TEMPLATES_DIR, "rebuild-index.sh");
  const rebuildDest = path2.join(resolvedPath, ".kb", "scripts", "rebuild-index.sh");
  await fs3.copy(rebuildSrc, rebuildDest);
  await fs3.chmod(rebuildDest, 493);
  log.step("rebuild-index.sh \uC0DD\uC131");
  const healthSrc = path2.join(TEMPLATES_DIR, "kb-health.yml");
  const coverageSrc = path2.join(TEMPLATES_DIR, "kb-coverage.yml");
  await fs3.copy(healthSrc, path2.join(resolvedPath, ".github", "workflows", "kb-health.yml"));
  await fs3.copy(coverageSrc, path2.join(resolvedPath, ".github", "workflows", "kb-coverage.yml"));
  log.step("GitHub Actions \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC0DD\uC131");
  await fs3.writeJson(path2.join(resolvedPath, "kb-index.json"), []);
  log.step("kb-index.json \uCD08\uAE30\uD654 (\uBE48 \uBC30\uC5F4)");
  const kbRulesSrc = path2.join(TEMPLATES_DIR, "kb-rules.md");
  const kbRulesContent = await fs3.readFile(kbRulesSrc, "utf-8");
  await fs3.writeFile(
    path2.join(resolvedPath, "ai-context", "kb-rules.md"),
    renderTemplate(kbRulesContent, vars)
  );
  const teamFocusSrc = path2.join(TEMPLATES_DIR, "team-focus.md");
  const teamFocusContent = await fs3.readFile(teamFocusSrc, "utf-8");
  await fs3.writeFile(
    path2.join(resolvedPath, "ai-context", "team-focus.md"),
    renderTemplate(teamFocusContent, vars)
  );
  log.step("ai-context/ \uD30C\uC77C \uC0DD\uC131 (kb-rules.md, team-focus.md)");
  await initRepo(resolvedPath, remoteUrl || void 0);
  log.step("git init" + (remoteUrl ? ` + remote: ${remoteUrl}` : ""));
  const gitHookDest = path2.join(resolvedPath, ".git", "hooks", "pre-commit");
  await fs3.copy(preCommitDest, gitHookDest);
  await fs3.chmod(gitHookDest, 493);
  log.step("pre-commit hook \uC124\uCE58 (.git/hooks/)");
  await saveKbPath(resolvedPath);
  const git = (await import("simple-git")).default(resolvedPath);
  await git.add(".");
  await git.commit("init: KB \uAD6C\uC870 \uC0DD\uC131");
  log.step("\uCD08\uAE30 \uCEE4\uBC0B \uC644\uB8CC");
  log.success(`KB \uC0DD\uC131 \uC644\uB8CC: ${resolvedPath}`);
  log.info("\uB2E4\uC74C \uB2E8\uACC4:");
  log.step("ai-context/ \uC624\uBC84\uBDF0 \uCD08\uC548 \uC791\uC131");
  log.step("git push");
  log.step("\uD300\uC6D0\uC5D0\uAC8C kb join \uC548\uB0B4");
}

// src/commands/join.ts
import { input as input2 } from "@inquirer/prompts";
import fs4 from "fs-extra";
import path3 from "path";
async function joinCommand(remoteUrl) {
  log.info("\uAE30\uC874 KB\uC5D0 \uD569\uB958\uD569\uB2C8\uB2E4.");
  const defaultPath = path3.join(process.env.HOME || "~", "team-kb");
  const kbPath = await input2({
    message: "\uB85C\uCEEC \uACBD\uB85C",
    default: defaultPath
  });
  const resolvedPath = kbPath.startsWith("~") ? kbPath.replace("~", process.env.HOME || "") : path3.resolve(kbPath);
  if (fs4.existsSync(resolvedPath) && fs4.readdirSync(resolvedPath).length > 0) {
    log.error(`${resolvedPath} \uAC00 \uC774\uBBF8 \uC874\uC7AC\uD558\uACE0 \uBE44\uC5B4\uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`);
    return;
  }
  log.info("git clone \uC911...");
  await cloneRepo(remoteUrl, resolvedPath);
  log.success("clone \uC644\uB8CC");
  const hookSrc = path3.join(resolvedPath, ".kb", "hooks", "pre-commit");
  const hookDest = path3.join(resolvedPath, ".git", "hooks", "pre-commit");
  if (fs4.existsSync(hookSrc)) {
    await fs4.copy(hookSrc, hookDest);
    await fs4.chmod(hookDest, 493);
    log.step("pre-commit hook \uC124\uCE58");
  } else {
    log.warn("pre-commit hook \uC6D0\uBCF8\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 (.kb/hooks/pre-commit)");
  }
  await saveKbPath(resolvedPath);
  log.success(`KB \uD569\uB958 \uC644\uB8CC: ${resolvedPath}`);
  log.info("\uB2E4\uC74C \uB2E8\uACC4:");
  log.step("cd ~/repos/{project} && kb wire claude (\uB610\uB294 gemini / codex)");
}

// src/commands/wire.ts
import { input as input3 } from "@inquirer/prompts";

// src/commands/wire-claude.ts
import fs7 from "fs-extra";
import path6 from "path";

// src/utils/symlink.ts
import fs5 from "fs-extra";
import path4 from "path";
async function createSymlink(target, linkPath) {
  await fs5.ensureDir(path4.dirname(linkPath));
  if (fs5.existsSync(linkPath)) {
    const stat = await fs5.lstat(linkPath);
    if (stat.isSymbolicLink()) {
      const existing = await fs5.readlink(linkPath);
      if (existing === target) {
        log.step(`symlink \uC774\uBBF8 \uC874\uC7AC: ${path4.basename(linkPath)}`);
        return;
      }
      await fs5.remove(linkPath);
    } else {
      log.warn(`${linkPath} \uC774 \uC77C\uBC18 \uD30C\uC77C\uB85C \uC874\uC7AC. symlink\uB85C \uAD50\uCCB4\uD569\uB2C8\uB2E4.`);
      await fs5.remove(linkPath);
    }
  }
  if (!fs5.existsSync(target)) {
    log.warn(`symlink \uB300\uC0C1 \uD30C\uC77C \uC5C6\uC74C: ${target} (\uB098\uC911\uC5D0 \uC0DD\uC131 \uD544\uC694)`);
  }
  await fs5.symlink(target, linkPath);
  log.step(`symlink \uC0DD\uC131: ${path4.basename(linkPath)} \u2192 ${target}`);
}

// src/utils/gitignore.ts
import fs6 from "fs-extra";
import path5 from "path";
async function ensureGitignorePatterns(dir, patterns) {
  const gitignorePath = path5.join(dir, ".gitignore");
  let content = "";
  if (fs6.existsSync(gitignorePath)) {
    content = await fs6.readFile(gitignorePath, "utf-8");
  }
  const lines = content.split("\n");
  const toAdd = [];
  for (const pattern of patterns) {
    const trimmed = pattern.trim();
    if (!lines.some((line) => line.trim() === trimmed)) {
      toAdd.push(trimmed);
    }
  }
  if (toAdd.length === 0) {
    return;
  }
  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  const section = separator + "\n# KB wiring (local-only)\n" + toAdd.join("\n") + "\n";
  await fs6.appendFile(gitignorePath, section);
  log.step(`.gitignore\uC5D0 ${toAdd.length}\uAC1C \uD328\uD134 \uCD94\uAC00`);
}

// src/commands/wire-claude.ts
function buildProjectSection(ctx) {
  let section = "\n## \uD504\uB85C\uC81D\uD2B8\n";
  section += `- ${ctx.techStack}
`;
  if (ctx.domains) section += `- \uB2F4\uB2F9: ${ctx.domains}
`;
  section += `- \uD604\uC7AC repo: ${ctx.repoName}
`;
  if (ctx.terms.length > 0) {
    section += "\n## \uB3C4\uBA54\uC778 \uC6A9\uC5B4\n";
    for (const { term, definition } of ctx.terms) {
      section += `- ${term}: ${definition}
`;
    }
  }
  return section;
}
function buildKbLocationContent(ctx) {
  return `## KB \uC808\uB300 \uACBD\uB85C
LLM\uC740 \uD30C\uC77C \uC811\uADFC \uBC0F \uC258 \uC2A4\uD06C\uB9BD\uD2B8 \uC2E4\uD589 \uC2DC \uBC18\uB4DC\uC2DC \uC544\uB798\uC758 \uC808\uB300 \uACBD\uB85C\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD560 \uAC83.
- KB \uB8E8\uD2B8: ${ctx.kbPath}
- \uC804\uCCB4 \uC778\uB371\uC2A4: ${ctx.kbPath}/kb-index.json
- \uB85C\uCEEC \uC778\uB371\uC2A4: ${ctx.kbPath}/.kb-index.local.json
- \uB85C\uCEEC \uC778\uB371\uC2A4 \uC7AC\uC0DD\uC131 \uC2A4\uD06C\uB9BD\uD2B8: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh
`;
}
async function wireClaude(ctx) {
  const rulesDir = path6.join(ctx.projectRoot, ".claude", "rules");
  await fs7.ensureDir(rulesDir);
  const claudeMdPath = path6.join(ctx.projectRoot, "CLAUDE.md");
  const projectSection = buildProjectSection(ctx);
  if (fs7.existsSync(claudeMdPath)) {
    const existing = await fs7.readFile(claudeMdPath, "utf-8");
    if (!existing.includes("## \uD504\uB85C\uC81D\uD2B8")) {
      await fs7.appendFile(claudeMdPath, projectSection);
      log.step("CLAUDE.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uCD94\uAC00");
    } else {
      log.step("CLAUDE.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uC774\uBBF8 \uC874\uC7AC \u2014 \uC2A4\uD0B5");
    }
  } else {
    await fs7.writeFile(claudeMdPath, projectSection.trimStart());
    log.step("CLAUDE.md \uC0DD\uC131");
  }
  const aiContextDir = path6.join(ctx.kbPath, "ai-context");
  const symlinkTargets = [
    { name: "kb-rules.md", target: path6.join(aiContextDir, "kb-rules.md") },
    { name: "team-focus.md", target: path6.join(aiContextDir, "team-focus.md") }
  ];
  if (fs7.existsSync(aiContextDir)) {
    const files = await fs7.readdir(aiContextDir);
    for (const file of files) {
      if (file.endsWith("-overview.md")) {
        symlinkTargets.push({
          name: file,
          target: path6.join(aiContextDir, file)
        });
      }
    }
  }
  for (const { name, target } of symlinkTargets) {
    await createSymlink(target, path6.join(rulesDir, name));
  }
  const locationPath = path6.join(rulesDir, "kb-location.md");
  await fs7.writeFile(locationPath, buildKbLocationContent(ctx));
  log.step("kb-location.md \uC0DD\uC131 (KB \uC808\uB300 \uACBD\uB85C)");
  const settingsPath = path6.join(ctx.projectRoot, ".claude", "settings.json");
  if (!fs7.existsSync(settingsPath)) {
    await fs7.writeJson(settingsPath, {}, { spaces: 2 });
    log.step(".claude/settings.json \uC0DD\uC131");
  }
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".claude/rules/"
  ]);
  log.success("Claude Code \uC5F0\uACB0 \uC644\uB8CC");
}

// src/commands/wire-gemini.ts
import fs8 from "fs-extra";
import path7 from "path";
function buildGeminiMd(ctx) {
  let content = "@.gemini/kb-import.md\n";
  content += "\n## \uD504\uB85C\uC81D\uD2B8\n";
  content += `- ${ctx.techStack}
`;
  if (ctx.domains) content += `- \uB2F4\uB2F9: ${ctx.domains}
`;
  content += `- \uD604\uC7AC repo: ${ctx.repoName}
`;
  if (ctx.terms.length > 0) {
    content += "\n## \uB3C4\uBA54\uC778 \uC6A9\uC5B4\n";
    for (const { term, definition } of ctx.terms) {
      content += `- ${term}: ${definition}
`;
    }
  }
  return content;
}
function buildKbImportMd(ctx) {
  const aiContext = path7.join(ctx.kbPath, "ai-context");
  let content = `## KB \uC808\uB300 \uACBD\uB85C
LLM\uC740 \uD30C\uC77C \uC811\uADFC \uBC0F \uC258 \uC2A4\uD06C\uB9BD\uD2B8 \uC2E4\uD589 \uC2DC \uBC18\uB4DC\uC2DC \uC544\uB798\uC758 \uC808\uB300 \uACBD\uB85C\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD560 \uAC83.
- KB \uB8E8\uD2B8: ${ctx.kbPath}
- \uC804\uCCB4 \uC778\uB371\uC2A4: ${ctx.kbPath}/kb-index.json
- \uB85C\uCEEC \uC778\uB371\uC2A4: ${ctx.kbPath}/.kb-index.local.json
- \uB85C\uCEEC \uC778\uB371\uC2A4 \uC7AC\uC0DD\uC131 \uC2A4\uD06C\uB9BD\uD2B8: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh

`;
  content += `@${aiContext}/kb-rules.md
`;
  content += `@${aiContext}/team-focus.md
`;
  if (fs8.existsSync(aiContext)) {
    const files = fs8.readdirSync(aiContext);
    for (const file of files) {
      if (file.endsWith("-overview.md")) {
        content += `@${aiContext}/${file}
`;
      }
    }
  }
  return content;
}
async function wireGemini(ctx) {
  const geminiDir = path7.join(ctx.projectRoot, ".gemini");
  await fs8.ensureDir(geminiDir);
  const geminiMdPath = path7.join(ctx.projectRoot, "GEMINI.md");
  if (fs8.existsSync(geminiMdPath)) {
    const existing = await fs8.readFile(geminiMdPath, "utf-8");
    if (!existing.includes("## \uD504\uB85C\uC81D\uD2B8")) {
      await fs8.appendFile(geminiMdPath, "\n" + buildGeminiMd(ctx));
      log.step("GEMINI.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uCD94\uAC00");
    } else {
      log.step("GEMINI.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uC774\uBBF8 \uC874\uC7AC \u2014 \uC2A4\uD0B5");
    }
  } else {
    await fs8.writeFile(geminiMdPath, buildGeminiMd(ctx));
    log.step("GEMINI.md \uC0DD\uC131");
  }
  const importPath = path7.join(geminiDir, "kb-import.md");
  await fs8.writeFile(importPath, buildKbImportMd(ctx));
  log.step(".gemini/kb-import.md \uC0DD\uC131 (KB \uACBD\uB85C + @import)");
  const settingsPath = path7.join(geminiDir, "settings.json");
  if (!fs8.existsSync(settingsPath)) {
    await fs8.writeJson(settingsPath, {}, { spaces: 2 });
    log.step(".gemini/settings.json \uC0DD\uC131");
  }
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".gemini/kb-import.md"
  ]);
  log.success("Gemini CLI \uC5F0\uACB0 \uC644\uB8CC");
}

// src/commands/wire-codex.ts
import fs9 from "fs-extra";
import path8 from "path";
function buildAgentsMd(ctx) {
  let content = "# Project\n";
  content += `- ${ctx.techStack}
`;
  if (ctx.domains) content += `- \uB2F4\uB2F9: ${ctx.domains}
`;
  content += `- \uD604\uC7AC repo: ${ctx.repoName}
`;
  content += "\n# Knowledge Base\n";
  content += "- \uC138\uC158 \uC2DC\uC791 \uC2DC \uBC18\uB4DC\uC2DC .codex/kb-directive.md \uD30C\uC77C\uC744 \uBA3C\uC800 \uC77D\uACE0 \uADF8 \uC548\uC758 \uACBD\uB85C \uC9C0\uC2DC\uB97C \uB530\uB97C \uAC83\n";
  if (ctx.terms.length > 0) {
    content += "\n# \uB3C4\uBA54\uC778 \uC6A9\uC5B4\n";
    for (const { term, definition } of ctx.terms) {
      content += `- ${term}: ${definition}
`;
    }
  }
  return content;
}
function buildDirectiveMd(ctx) {
  const aiContext = path8.join(ctx.kbPath, "ai-context");
  return `## KB \uC791\uB3D9 \uC9C0\uC2DC
- \uC138\uC158 \uC2DC\uC791 \uC2DC \uBC18\uB4DC\uC2DC ${aiContext}/kb-rules.md \uB97C \uBA3C\uC800 \uC77D\uC744 \uAC83

## KB \uC808\uB300 \uACBD\uB85C
LLM\uC740 \uD30C\uC77C \uC811\uADFC \uBC0F \uC258 \uC2A4\uD06C\uB9BD\uD2B8 \uC2E4\uD589 \uC2DC \uBC18\uB4DC\uC2DC \uC544\uB798\uC758 \uC808\uB300 \uACBD\uB85C\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD560 \uAC83.
- KB \uB8E8\uD2B8: ${ctx.kbPath}
- \uC804\uCCB4 \uC778\uB371\uC2A4: ${ctx.kbPath}/kb-index.json
- \uB85C\uCEEC \uC778\uB371\uC2A4: ${ctx.kbPath}/.kb-index.local.json
- \uB85C\uCEEC \uC778\uB371\uC2A4 \uC7AC\uC0DD\uC131 \uC2A4\uD06C\uB9BD\uD2B8: ${ctx.kbPath}/.kb/scripts/rebuild-index.sh
`;
}
async function wireCodex(ctx) {
  const codexDir = path8.join(ctx.projectRoot, ".codex");
  await fs9.ensureDir(codexDir);
  const agentsMdPath = path8.join(ctx.projectRoot, "AGENTS.md");
  if (fs9.existsSync(agentsMdPath)) {
    const existing = await fs9.readFile(agentsMdPath, "utf-8");
    if (!existing.includes("# Project")) {
      await fs9.appendFile(agentsMdPath, "\n" + buildAgentsMd(ctx));
      log.step("AGENTS.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uCD94\uAC00");
    } else {
      log.step("AGENTS.md\uC5D0 \uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4 \uC774\uBBF8 \uC874\uC7AC \u2014 \uC2A4\uD0B5");
    }
  } else {
    await fs9.writeFile(agentsMdPath, buildAgentsMd(ctx));
    log.step("AGENTS.md \uC0DD\uC131");
  }
  const directivePath = path8.join(codexDir, "kb-directive.md");
  await fs9.writeFile(directivePath, buildDirectiveMd(ctx));
  log.step(".codex/kb-directive.md \uC0DD\uC131 (KB \uACBD\uB85C + \uC9C0\uC2DC)");
  await ensureGitignorePatterns(ctx.projectRoot, [
    ".codex/kb-directive.md"
  ]);
  log.success("Codex CLI \uC5F0\uACB0 \uC644\uB8CC");
}

// src/commands/wire.ts
async function collectWireContext() {
  let kbPath = getKbPath();
  if (!kbPath) {
    kbPath = await input3({
      message: "KB \uACBD\uB85C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. KB \uC808\uB300 \uACBD\uB85C\uB97C \uC785\uB825\uD558\uC138\uC694"
    });
  }
  if (!kbPath) {
    log.error("KB \uACBD\uB85C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. kb init \uB610\uB294 kb join\uC744 \uBA3C\uC800 \uC2E4\uD589\uD558\uC138\uC694.");
    return null;
  }
  const projectRoot = process.cwd();
  const repoName = projectRoot.split("/").pop() || "unknown";
  const techStack = await input3({
    message: "\uAE30\uC220 \uC2A4\uD0DD",
    default: "Spring Boot + Kotlin, Gradle"
  });
  const domains = await input3({
    message: "\uB2F4\uB2F9 \uB3C4\uBA54\uC778",
    default: ""
  });
  const terms = [];
  log.info("\uB3C4\uBA54\uC778 \uC6A9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694 (\uBE48 \uC904\uB85C \uC885\uB8CC):");
  while (true) {
    const term = await input3({
      message: "\uC6A9\uC5B4 (\uC5D4\uD130\uB85C \uC885\uB8CC)",
      default: ""
    });
    if (!term) break;
    const definition = await input3({
      message: `${term}\uC758 \uC815\uC758`
    });
    terms.push({ term, definition });
  }
  return { kbPath, projectRoot, techStack, domains, repoName, terms };
}
async function wireCommand(tool) {
  const validTools = ["claude", "gemini", "codex"];
  if (!validTools.includes(tool)) {
    log.error(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uB3C4\uAD6C: ${tool}. (claude, gemini, codex \uC911 \uC120\uD0DD)`);
    return;
  }
  log.info(`\uD504\uB85C\uC81D\uD2B8\uC5D0 ${tool} \uC5F0\uACB0\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.`);
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

// src/commands/doctor.ts
import fs10 from "fs-extra";
import path9 from "path";
async function doctorCommand() {
  log.info("KB \uD658\uACBD \uC9C4\uB2E8\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.\n");
  const results = [];
  const kbPath = getKbPath();
  results.push({
    name: `\uC124\uC815 \uD30C\uC77C (${CONFIG_PATH})`,
    ok: !!kbPath,
    detail: kbPath || "\uBBF8\uC124\uC815. kb init \uB610\uB294 kb join\uC744 \uBA3C\uC800 \uC2E4\uD589\uD558\uC138\uC694."
  });
  if (!kbPath) {
    printResults(results);
    return;
  }
  const kbExists = fs10.existsSync(kbPath);
  results.push({
    name: "KB \uB514\uB809\uD1A0\uB9AC \uC811\uADFC",
    ok: kbExists,
    detail: kbExists ? kbPath : `${kbPath} \uACBD\uB85C\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
  });
  if (!kbExists) {
    printResults(results);
    return;
  }
  const kbRulesPath = path9.join(kbPath, "ai-context", "kb-rules.md");
  const kbRulesExists = fs10.existsSync(kbRulesPath);
  results.push({
    name: "ai-context/kb-rules.md",
    ok: kbRulesExists,
    detail: kbRulesExists ? "\uC874\uC7AC" : "\uC5C6\uC74C. ai-context/ \uCD08\uAE30 \uD30C\uC77C\uC744 \uC791\uC131\uD558\uC138\uC694."
  });
  const indexPath = path9.join(kbPath, "kb-index.json");
  const indexExists = fs10.existsSync(indexPath);
  results.push({
    name: "kb-index.json",
    ok: indexExists,
    detail: indexExists ? "\uC874\uC7AC" : "\uC5C6\uC74C. git push \uD6C4 CI\uAC00 \uC0DD\uC131\uD569\uB2C8\uB2E4."
  });
  const hookPath = path9.join(kbPath, ".git", "hooks", "pre-commit");
  const hookExists = fs10.existsSync(hookPath);
  results.push({
    name: "pre-commit hook",
    ok: hookExists,
    detail: hookExists ? "\uC124\uCE58\uB428" : "\uBBF8\uC124\uCE58. kb join\uC744 \uB2E4\uC2DC \uC2E4\uD589\uD558\uC138\uC694."
  });
  const cwd = process.cwd();
  if (cwd !== kbPath) {
    const claudeRulesDir = path9.join(cwd, ".claude", "rules");
    if (fs10.existsSync(claudeRulesDir)) {
      const kbRulesLink = path9.join(claudeRulesDir, "kb-rules.md");
      if (fs10.existsSync(kbRulesLink)) {
        const stat = await fs10.lstat(kbRulesLink);
        if (stat.isSymbolicLink()) {
          const target = await fs10.readlink(kbRulesLink);
          const targetValid = fs10.existsSync(target);
          results.push({
            name: "Claude symlink (kb-rules.md)",
            ok: targetValid,
            detail: targetValid ? `\u2192 ${target}` : `\uAE68\uC9C4 symlink \u2192 ${target}`
          });
        }
      }
      const locationFile = path9.join(claudeRulesDir, "kb-location.md");
      results.push({
        name: "Claude kb-location.md",
        ok: fs10.existsSync(locationFile),
        detail: fs10.existsSync(locationFile) ? "\uC874\uC7AC" : "\uC5C6\uC74C. kb wire claude\uB97C \uC2E4\uD589\uD558\uC138\uC694."
      });
    }
    const geminiImport = path9.join(cwd, ".gemini", "kb-import.md");
    if (fs10.existsSync(path9.join(cwd, "GEMINI.md"))) {
      results.push({
        name: "Gemini kb-import.md",
        ok: fs10.existsSync(geminiImport),
        detail: fs10.existsSync(geminiImport) ? "\uC874\uC7AC" : "\uC5C6\uC74C. kb wire gemini\uB97C \uC2E4\uD589\uD558\uC138\uC694."
      });
    }
    const codexDirective = path9.join(cwd, ".codex", "kb-directive.md");
    if (fs10.existsSync(path9.join(cwd, "AGENTS.md"))) {
      results.push({
        name: "Codex kb-directive.md",
        ok: fs10.existsSync(codexDirective),
        detail: fs10.existsSync(codexDirective) ? "\uC874\uC7AC" : "\uC5C6\uC74C. kb wire codex\uB97C \uC2E4\uD589\uD558\uC138\uC694."
      });
    }
  }
  printResults(results);
}
function printResults(results) {
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
    log.success("\uBAA8\uB4E0 \uAC80\uC99D \uD1B5\uACFC");
  } else {
    log.warn("\uC77C\uBD80 \uD56D\uBAA9\uC5D0 \uBB38\uC81C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC704 \uBA54\uC2DC\uC9C0\uB97C \uD655\uC778\uD558\uC138\uC694.");
  }
}

// src/commands/uninstall.ts
import { confirm } from "@inquirer/prompts";
import fs11 from "fs-extra";
import path10 from "path";
async function uninstallCommand() {
  log.info("KB wiring \uC81C\uAC70\uB97C \uC2DC\uC791\uD569\uB2C8\uB2E4.\n");
  const cwd = process.cwd();
  let removed = 0;
  const claudeRulesDir = path10.join(cwd, ".claude", "rules");
  if (fs11.existsSync(claudeRulesDir)) {
    const files = await fs11.readdir(claudeRulesDir);
    for (const file of files) {
      const filePath = path10.join(claudeRulesDir, file);
      const stat = await fs11.lstat(filePath);
      if (stat.isSymbolicLink()) {
        await fs11.remove(filePath);
        log.step(`symlink \uC0AD\uC81C: .claude/rules/${file}`);
        removed++;
      }
    }
    const locationPath = path10.join(claudeRulesDir, "kb-location.md");
    if (fs11.existsSync(locationPath)) {
      await fs11.remove(locationPath);
      log.step("\uC0AD\uC81C: .claude/rules/kb-location.md");
      removed++;
    }
  }
  const geminiImport = path10.join(cwd, ".gemini", "kb-import.md");
  if (fs11.existsSync(geminiImport)) {
    await fs11.remove(geminiImport);
    log.step("\uC0AD\uC81C: .gemini/kb-import.md");
    removed++;
  }
  const codexDirective = path10.join(cwd, ".codex", "kb-directive.md");
  if (fs11.existsSync(codexDirective)) {
    await fs11.remove(codexDirective);
    log.step("\uC0AD\uC81C: .codex/kb-directive.md");
    removed++;
  }
  if (removed > 0) {
    log.success(`\uD504\uB85C\uC81D\uD2B8 wiring ${removed}\uAC1C \uD30C\uC77C \uC81C\uAC70 \uC644\uB8CC`);
  } else {
    log.info("\uD604\uC7AC \uB514\uB809\uD1A0\uB9AC\uC5D0 \uC81C\uAC70\uD560 wiring \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  const trackedFiles = ["CLAUDE.md", "GEMINI.md", "AGENTS.md"].filter(
    (f) => fs11.existsSync(path10.join(cwd, f))
  );
  if (trackedFiles.length > 0) {
    log.warn(
      `${trackedFiles.join(", ")}\uC758 \uD504\uB85C\uC81D\uD2B8 \uC139\uC158\uC740 \uC218\uB3D9\uC73C\uB85C \uC815\uB9AC\uD558\uC138\uC694 (\uC0AC\uC6A9\uC790 \uB0B4\uC6A9\uACFC \uC11E\uC5EC\uC788\uC744 \uC218 \uC788\uC74C).`
    );
  }
  const kbPath = getKbPath();
  const shouldRemoveConfig = await confirm({
    message: `\uC124\uC815 \uD30C\uC77C\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694? (${CONFIG_PATH})`,
    default: true
  });
  if (shouldRemoveConfig) {
    const didRemove = await removeConfig();
    if (didRemove) {
      log.step("\uC124\uC815 \uD30C\uC77C \uC0AD\uC81C \uC644\uB8CC");
    }
  }
  if (kbPath && fs11.existsSync(kbPath)) {
    const shouldRemoveKb = await confirm({
      message: `KB \uB514\uB809\uD1A0\uB9AC\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694? (${kbPath}) \u2014 \uD300 \uC9C0\uC2DD\uC774 \uBAA8\uB450 \uC0AD\uC81C\uB429\uB2C8\uB2E4!`,
      default: false
    });
    if (shouldRemoveKb) {
      await fs11.remove(kbPath);
      log.step(`KB \uB514\uB809\uD1A0\uB9AC \uC0AD\uC81C: ${kbPath}`);
    } else {
      log.info(`KB \uB514\uB809\uD1A0\uB9AC \uC720\uC9C0: ${kbPath}`);
    }
  }
  console.log();
  log.success("uninstall \uC644\uB8CC");
  log.info("npm uninstall -g kb-cli \uB85C CLI \uC790\uCCB4\uB3C4 \uC81C\uAC70\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
}

// src/index.ts
var program = new Command();
program.name("kb").description("Team Knowledge Base harness CLI").version("0.1.0");
program.command("init").description("KB \uCD5C\uCD08 \uC0DD\uC131 (\uD300 \uB9AC\uB4DC)").action(initCommand);
program.command("join").description("\uAE30\uC874 KB\uC5D0 \uD569\uB958 (\uD300\uC6D0)").argument("<remote-url>", "Git remote URL").action(joinCommand);
program.command("wire").description("\uD504\uB85C\uC81D\uD2B8\uC5D0 LLM \uB3C4\uAD6C \uC5F0\uACB0").argument("<tool>", "claude | gemini | codex").action(wireCommand);
program.command("doctor").description("KB \uD658\uACBD \uBB34\uACB0\uC131 \uAC80\uC99D").action(doctorCommand);
program.command("uninstall").description("KB wiring \uC81C\uAC70 + \uC124\uC815 \uC815\uB9AC").action(uninstallCommand);
program.parse();
//# sourceMappingURL=index.js.map