# Copilot instructions

Read and follow `AGENTS.md` at the repository root: it holds the instructions
for every AI agent in this repository (Next.js 16 differs from your training
data; the open-core boundary; never commit secrets; coding conventions).

To install Passive Coder CMS for the user, follow `selfhost/AI-INSTALL.md`
step by step. Secrets never pass through the chat: write empty slots with
`node selfhost/cli/index.mjs env-slots` and tell the user where to paste each
value. Stop and ask before anything that costs money, needs a login, or
deletes data.
