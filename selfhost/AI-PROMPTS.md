# Install with one prompt

Open your AI coding agent in an empty folder on your computer, paste the
prompt for it, and answer its questions. It asks where the site should run
(Vercel + Supabase, your own server, or this computer), asks you to log in
to Supabase and Vercel in your browser, and stops to ask before anything that
costs money. You paste your keys into a file on your computer, never into
the chat.

The agent follows [AI-INSTALL.md](AI-INSTALL.md).

## Claude Code

Run `claude` in an empty folder, then paste:

```text
Install Passive Coder CMS for me from https://github.com/PassiveCoderOfficial/PassiveCoderCMS: clone it and follow selfhost/AI-INSTALL.md step by step. Ask me where it should run first, never ask me to paste keys into this chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

## OpenAI Codex / ChatGPT

Use the Codex CLI (`codex`) or the Codex app on your computer: the install
needs your browser for the Supabase and Vercel logins, which a cloud task
cannot do. Paste:

```text
Install Passive Coder CMS from https://github.com/PassiveCoderOfficial/PassiveCoderCMS on this computer: clone it and follow selfhost/AI-INSTALL.md exactly (AGENTS.md in the repo points to it). Ask me which target I want first, keep every key out of this chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

## Cursor / Windsurf

Open an empty folder, start the agent (Cursor: Agent mode; Windsurf:
Cascade), and paste:

```text
Clone https://github.com/PassiveCoderOfficial/PassiveCoderCMS into this folder and install Passive Coder CMS by following selfhost/AI-INSTALL.md step by step, running each check it lists. Ask me where it should run first, never ask me to paste keys into the chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

## Gemini CLI / GitHub Copilot

Gemini CLI: run `gemini` in an empty folder. GitHub Copilot: open an empty
folder in VS Code and use Copilot Chat in Agent mode. Paste:

```text
Install Passive Coder CMS from https://github.com/PassiveCoderOfficial/PassiveCoderCMS: clone it, then read selfhost/AI-INSTALL.md and follow it step by step, verifying each step. Ask me where it should run first, never ask me to paste keys into the chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

## Already installed, something is wrong?

On `/setup`, each red check has an **Ask your AI to fix this** button. It
copies a prompt with the problem and the fix steps (never your keys): paste
it into your agent. In a terminal, `node selfhost/cli/index.mjs doctor --json`
gives the agent the same information.

## Stuck?

- We install it for you: [Cloud, $99](https://passivecoder.com/api/open-source/checkout?item=install_cloud),
  [own server, $199](https://passivecoder.com/api/open-source/checkout?item=install_server).
- Open an [issue](https://github.com/PassiveCoderOfficial/PassiveCoderCMS/issues) with the output of
  `node selfhost/cli/index.mjs doctor --redact` (secrets and addresses removed).
- Try the hosted version free for 7 days: https://passivecoder.com
- Hosted and developer plans: https://passivecoder.com/pricing
