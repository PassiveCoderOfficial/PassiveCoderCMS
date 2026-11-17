# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, Cursor, Windsurf,
Gemini CLI, GitHub Copilot) working in this repository: Passive Coder CMS, a
self-hosted website builder and business dashboard (one site per install),
open-source core under the GNU AGPL v3.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version (Next.js 16, React 19) has breaking changes: APIs, conventions
and file structure may differ from your training data. Read the relevant
guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation
notices. Middleware lives in `src/proxy.ts`.
<!-- END:nextjs-agent-rules -->

## Install (the user asked you to set it up)

Follow **[selfhost/AI-INSTALL.md](selfhost/AI-INSTALL.md)** step by step. It
asks the user for a target (cloud = Vercel + Supabase, own server, or this
computer), creates the Supabase project, deploys, loads the database and
opens `/setup`. Its rules are not optional:

- Secrets never pass through the chat. Write empty slots
  (`node selfhost/cli/index.mjs env-slots`), tell the user where to paste each
  value, never print a settings file or a value.
- Stop and ask before anything that costs money, needs a login, or deletes
  data.
- Diagnose with `node selfhost/cli/index.mjs doctor --json`.

Human guides: [selfhost/README.md](selfhost/README.md),
[selfhost/INSTALL-CLOUD.md](selfhost/INSTALL-CLOUD.md),
[selfhost/INSTALL-SERVER.md](selfhost/INSTALL-SERVER.md).

## Run, update, test

| Task | Command |
|---|---|
| Install packages | `npm ci` |
| Check an install | `node selfhost/cli/index.mjs doctor` (`--json` for machines) |
| Run (builds when needed) | `node selfhost/cli/index.mjs start` |
| Dev server | `npm run dev` (needs `.env.local` with `NEXT_PUBLIC_CMS_MODE=standalone`) |
| Update code + database | `node selfhost/cli/index.mjs update` |
| Type check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Tests | `npm run test:installer` (and the other `test:*` scripts in package.json) |

A production build (`npm run build`) needs about 6 GB of memory. Prefer
`npx tsc --noEmit` and the tests for checking a change.

## Layout

- `src/app`: Next.js App Router. `(admin)/dashboard` is the owner dashboard,
  `(site)` the public site, `setup` + `api/setup` the web installer.
- `src/modules`: page builder, header/footer studio, navigation, templates,
  themes. Blocks are in `src/components/blocks`.
- `src/lib`: server and shared logic (Supabase clients in `src/lib/supabase`,
  AI providers in `src/lib/ai/provider.ts`, i18n in `src/lib/i18n`).
- `selfhost/`: installers (`cli/`, `install.sh`, `update.sh`), shared install
  logic (`lib/`), the database (`schema.sql`, plus `supabase/migrations` newer
  than it).
- `tests/`: `node:test` suites run with `tsx --test`.

## The open-core boundary

This repository is the open core of the hosted Passive Coder platform. The
hosted layer (multi-site hosting, billing, partners, the MCP server) and the
paid modules (marketplace, POS, restaurant, real estate, projects,
accounting and others) are not here. Where the core calls one of them, it
calls a stand-in: `src/modules/registry` is empty in this copy. Rules:

- Do not add code that needs a missing module or a hosted-only service. Use
  the registry hooks and keep the core working on its own.
- Paid modules turn on only with a signed `licence.json`
  (`src/lib/licence`). Do not bypass or weaken the licence check.
- Code you add is AGPL-3.0; contributions need the CLA
  ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Never commit secrets

- `.env`, `.env.local` and every other `.env*` except `.env.example` stay
  out of git (see `.gitignore`). So do `licence.json`, backups, site packages
  and database dumps.
- No keys, passwords, tokens, connection strings or customer data in code,
  tests, fixtures, screenshots or commit messages. Build key-shaped test
  values at run time.
- Report security problems privately ([SECURITY.md](SECURITY.md)).

## Coding conventions

- TypeScript strict; run `npx tsc --noEmit` before you finish. Small, focused
  changes; one concern per pull request.
- Server-only code imports `server-only`. Validate request bodies with `zod`.
  Supabase access goes through the clients in `src/lib/supabase` and row-level
  security; never expose the service-role key to the browser.
- UI: Tailwind CSS 4 and the components in `src/components/ui`. User-facing
  text goes through i18n (`src/lib/i18n/locales/en.ts` and `bn.ts`, same keys
  in both).
- Pages are built from blocks: extend an existing block with a variant
  rather than adding a near-duplicate block. No raw custom HTML on sites.
- Times are shown in the site's configured time zone, never raw UTC.
- Plain English in messages and docs: short sentences, no jargon the site
  owner would not know.
- Tests: `node:test` + `node:assert/strict` in `tests/`, no network, fakes for
  Supabase, mail and CLIs.
