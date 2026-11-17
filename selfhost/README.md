# Self-hosting Passive Coder CMS (one site)

Your own site, your own database. Pick one of three ways. Each ends in the
same place: a setup page in your browser that checks everything, sets up
the database, and creates your admin login.

All three need a Supabase project (supabase.com, the free plan works). It
holds the database, the logins and the uploaded files.

## 0. Install with one prompt (an AI coding agent does it)

Open Claude Code, Codex, Cursor, Windsurf, Gemini CLI or GitHub Copilot in an
empty folder and paste:

```text
Install Passive Coder CMS for me from https://github.com/PassiveCoderOfficial/PassiveCoderCMS: clone it and follow selfhost/AI-INSTALL.md step by step. Ask me where it should run first, never ask me to paste keys into this chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

The agent asks where the site should run (any of the three ways below),
creates the Supabase project after you log in in your browser, deploys,
loads the database and opens the setup page. Your keys go into a file on
your computer, never into the chat. Prompts for each agent:
[AI-PROMPTS.md](AI-PROMPTS.md). The runbook the agent follows:
[AI-INSTALL.md](AI-INSTALL.md).

## 1. One click: Vercel (no server, no terminal)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS&project-name=passivecoder-cms&repository-name=passivecoder-cms&env=NEXT_PUBLIC_SUPABASE_URL%2CNEXT_PUBLIC_SUPABASE_ANON_KEY%2CSUPABASE_SERVICE_ROLE_KEY%2CDATABASE_URL%2CSETUP_TOKEN%2CCRON_SECRET&envDescription=Four+values+from+your+Supabase+project%2C+and+two+passwords+you+make+up+now.+The+guide+shows+where+each+one+is.&envLink=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS%2Fblob%2Fmain%2Fselfhost%2FINSTALL-CLOUD.md%232-click-deploy)

1. Click the button. Vercel asks for four values from Supabase and two
   passwords you make up.
2. When the deploy is ready, open `/setup` on your new site.

Guide: [INSTALL-CLOUD.md](INSTALL-CLOUD.md).

## 2. One command on a server (Ubuntu or Debian)

```bash
curl -fsSL https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/main/selfhost/install.sh | sudo sh
```

1. Point your domain at the server.
2. Run the command. It asks for the domain and the Supabase values.
3. Open the link it prints.

HTTPS, scheduled jobs and daily backups are set up for you. A 1 GB server
is enough. Guide: [INSTALL-SERVER.md](INSTALL-SERVER.md).

## 3. One command anywhere (your computer, any server with Node.js)

With Node.js 22 and git:

```bash
git clone https://github.com/PassiveCoderOfficial/PassiveCoderCMS.git
cd PassiveCoderCMS
node selfhost/cli/index.mjs init
```

It asks for the Supabase values and the site address, checks them, writes
`.env.local`, sets up the database, builds the app (about 6 GB of memory,
10 to 20 minutes) and opens the setup page.

Other commands:

- `node selfhost/cli/index.mjs doctor`: checks an install and says how to
  fix what is wrong (the same checks as the setup page).
- `node selfhost/cli/index.mjs start`: runs the site (builds first when
  needed).
- `node selfhost/cli/index.mjs update`: gets the new version, updates the
  database, and builds.
- For AI agents: `doctor --json` (the checks as JSON: id, status, message,
  fix, docs link; never a setting's value), `doctor --redact` (also hides
  addresses and hosts, for a GitHub issue), and the helpers `env-slots`,
  `env-status`, `supabase-create`, `supabase-keys`, `vercel-env` and
  `open-setup`, which move keys between the Supabase and Vercel CLIs and the
  settings file without printing them. See [AI-INSTALL.md](AI-INSTALL.md).

## The setup page

`/setup` works the same on every path:

1. **System check**: settings, Supabase, the secret key, the database
   connection, tables and their version, file storage, secret keys, the
   setup code, scheduled jobs, email and the site address. Each problem
   comes with a plain fix and a "Check again" button, an "Ask your AI to
   fix this" button that copies a ready prompt for your coding agent (no
   keys in it), and, when a Passive Coder AI key is set, "Explain this"
   (sends only the names and messages of the failed checks).
2. **Database**: when it is empty, one button sets it up (about a minute,
   all or nothing, safe to retry). It never touches a database that holds
   other tables.
3. **Your site**: name, language, time zone, currency.
4. **Your account**: the admin email and password. It always makes a new
   account; it never changes an existing one.
5. **Extras** (all optional): a starter design, outgoing email with a test
   email, a Passive Coder AI key, a paid-modules licence.

Then it locks itself for good. While it is open, a setup code
(`SETUP_TOKEN`) keeps strangers out; install.sh and the CLI make one and
print a link that carries it.

## Why your site never needs a rebuild for a setting

Next.js writes settings that start with `NEXT_PUBLIC_` into the app when it
is built. Each path handles that for you:

- **Vercel** builds the app from your settings, and takes the site address
  from the project's own domain. After changing such a setting, click
  Redeploy; the setup page tells you if one is needed.
- **The server install** uses one ready-made image built with placeholder
  values. When the container starts, it puts your settings in their place
  (`docker-entrypoint.mjs`, `lib/runtime-config.mjs`). A change in `.env`
  needs a restart, not a build, and the server never needs 8 GB of memory.
- **The CLI** builds on your machine and remembers which settings it built
  with; `start` rebuilds by itself when one changes.

## Files in this folder

- `AI-INSTALL.md`: the runbook AI coding agents follow; `AI-PROMPTS.md`:
  one copy-paste prompt per agent.
- `install.sh`, `update.sh`: the server install and updates
  (`install.sh --hide-code` keeps the setup code out of the output).
- `cli/`: the command-line installer (`init`, `doctor`, `start`, `update`).
- `lib/`: the shared logic of all installers: settings and secrets
  (`env.mjs`), the checks (`checks.mjs`, `check-messages.mjs`), database set-up
  and updates (`db.mjs`), who may use the setup page (`gate.mjs`), and the
  ready-made image's settings swap (`runtime-config.mjs`), and the help for
  AI agents: machine-readable checks, fix prompts, secret scrubbing
  (`agent-help.mjs`) and settings-file slots and Supabase keys
  (`agent-env.mjs`).
- `docker-entrypoint.mjs`: start command of the Docker image.
- `.env.example`: every setting, required ones first.
- `schema.sql`: the whole database. `setup-db.mjs` and `migrate.mjs` load
  it and apply updates from a terminal.
- `import-site.mjs`: load a site package when moving from Passive Coder
  hosting.
- `vercel.json`, `crontab.example`: the scheduled jobs.

## AI

- **Passive Coder AI** (recommended): set `PASSIVECODER_AI_KEY` (get one at
  https://passivecoder.com/api-signup). Every AI feature, including
  building a whole site, paid with AI credits.
- **Own key** (advanced): `OPENROUTER_API_KEY`, `OPENAI_API_KEY` or
  `ANTHROPIC_API_KEY`. Writing and rewriting text and the site chat.

## Paid modules (licence)

Paid modules are turned on by a `licence.json` signed by Passive Coder for
one site (its domain and site id). The app checks it offline, with no call
to Passive Coder; without a valid one the site runs with the free core
modules. Upload it on the setup page, or put it in the data folder
(server install: `/opt/passivecoder/data/licence.json`), or its contents in
`PASSIVECODER_LICENCE` (Vercel). Terms: `LICENSE-MODULES.txt`.

## Moving a site from Passive Coder hosting

Ask for it in your dashboard (Settings > Move to self-host; the site owner
only). You get a site package. On a fresh install, before opening `/setup`:

```bash
node selfhost/import-site.mjs <package folder> --dry-run
node selfhost/import-site.mjs <package folder> --owner-password '<new password>'
```

The server guide shows the same with Docker. The owner signs in with the
new password; everyone else uses "Forgot password". Payment and courier
keys come across (set `COURIER_SECRET_KEY` first). The package holds
customer data and keys: keep it private and delete it once the site runs.
