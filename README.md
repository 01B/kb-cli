# @01b/team-kb

CLI tool for building and wiring a Team Knowledge Base (KB) so that LLMs (Claude, Gemini, Codex) can automatically leverage shared team knowledge.

## Why

- LLM sessions reset every time. Domain knowledge explained yesterday is forgotten today.
- Knowledge stays siloed — what one developer teaches Claude, another's Gemini doesn't know.
- LLMs ignore team coding conventions because they don't know they exist.

**@01b/team-kb** solves this by creating a shared, git-based knowledge base that automatically loads into any LLM tool across your team.

## Install

```
npm install -g @01b/team-kb
```

## Commands

### `kb init`

Create a new KB repository. Run once per team.

```
mkdir ~/team-kb && cd ~/team-kb
kb init
```

Generates:

```
team-kb/
├── ai-context/          # Auto-loaded by LLMs
│   ├── kb-rules.md      # Search, record, and reference rules
│   └── team-focus.md    # Team intro and focus areas
├── rules/               # Verified business rules
├── analysis/            # Code analysis results
├── decisions/           # Decision records
├── troubleshoot/        # Incident responses
├── drafts/              # Unverified drafts
├── archive/             # Inactive notes
├── templates/           # Note templates
├── .kb/
│   ├── hooks/pre-commit # Frontmatter validation + index rebuild
│   └── scripts/         # rebuild-index.sh
├── .github/workflows/   # CI health checks
└── kb-index.json        # Search index (auto-generated)
```

### `kb join <url>`

Join an existing KB. Run once per team member.

```
kb join https://github.com/your-org/team-kb.git
```

This will:
- `git clone` the KB repository
- Install the pre-commit hook
- Save the KB path to local config

### `kb wire <tool>`

Wire a project to the KB. Run once per project per tool.

```
cd ~/repos/my-project
kb wire claude    # Claude Code
kb wire gemini    # Gemini CLI
kb wire codex     # Codex CLI
```

#### Claude

Creates symlinks in `.claude/rules/` pointing to KB files. Claude Code auto-scans this directory, so KB rules and knowledge are loaded automatically every session.

#### Gemini

Creates `GEMINI.md` with `@import` chain via `.gemini/kb-context/` symlink. Gemini loads `GEMINI.md` as a foundational mandate, which imports KB rules and knowledge through the symlink.

#### Codex

Creates `AGENTS.md` with a directive to read `.codex/kb-directive.md`. Codex reads `AGENTS.md` on session start and follows the instruction to load KB content via tool calls.

### How wiring works

```
Claude:  .claude/rules/ ── auto-scan ──→ symlinks ──→ KB ai-context/
Gemini:  GEMINI.md ──@import──→ kb-import.md ──@import──→ kb-context/ (symlink) ──→ KB ai-context/
Codex:   AGENTS.md ──directive──→ kb-directive.md ──tool call──→ KB ai-context/
```

**Tracked vs local-only**: Tracked files (git commit) contain only KB entry points. Files with absolute paths are local-only (`.gitignore`) to prevent path conflicts between team members.

## Recording Knowledge

While working with an LLM, when you discover new domain knowledge:

```
"Record this to KB"
```

The LLM will:
1. Determine the appropriate folder based on content type
2. Create a note with proper frontmatter (tags, tldr, created, updated)
3. The pre-commit hook automatically rebuilds the search index on commit

### Tag namespaces

Tags use `/` as a namespace separator (Obsidian-compatible):

```yaml
tags: [repo/my-service, domain/coupon, tech/redis]
```

### Folder guide

| Folder | Purpose |
|--------|---------|
| `rules/` | Team-verified business rules |
| `analysis/` | Code analysis results |
| `decisions/` | Decision records |
| `troubleshoot/` | Incident response records |
| `drafts/` | Unverified drafts |

## KB Search Rules

Defined in `ai-context/kb-rules.md` and auto-loaded into every LLM session:

- **KB first** — For domain knowledge questions, check KB before searching code
- **Code is truth** — KB is a guide, code is the source of truth. Lightly verify against code when answering about code behavior
- **Mismatch handling** — If KB and code disagree, answer based on code + report the mismatch + suggest KB update
- **Efficient search** — Grep keywords in index for large KBs, full read for small ones (≤50 notes)

## Trust Hierarchy

| Folder | Trust level |
|--------|-------------|
| `global/` | Highest — org-wide rules |
| `rules/`, `decisions/` | Team-verified |
| `analysis/`, `troubleshoot/` | Generally reliable — lightly verify |
| `drafts/` | Unverified — must verify |
| `archive/` | Inactive — may be outdated |

## Works with Obsidian

The KB is a plain folder of markdown files with YAML frontmatter — Obsidian reads it natively as a vault. Tags use `/` separator, which Obsidian renders as a navigable tree in the tag panel. Obsidian CLI (v1.12+) can also be used to search and manage KB notes from the terminal.

## License

MIT
