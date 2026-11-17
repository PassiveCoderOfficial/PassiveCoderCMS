# Passive Coder CMS

A website builder and business dashboard you host yourself: one site, your own
database, your own server. Built with Next.js and Supabase (Postgres, auth and
file storage). This is the open-source core of the hosted Passive Coder
platform, published under the GNU AGPL v3.

More about the project: https://passivecoder.com/open-source-cms

## What is in this repository

- **Pages and page builder**: drag-and-drop blocks, live preview, drafts,
  reusable header and footer, themes and ready-made templates.
- **Blog**: posts, categories, scheduled publishing.
- **Media library**, navigation menus, redirects, SEO settings, sitemap and
  multi-language pages.
- **Leads and CRM**: contact forms, contacts, pipeline, reminders, email
  campaigns, spam filter.
- **Bookings**: services, availability, reminders.
- **Single-store shop**: products, categories, stock, cart, checkout, orders,
  delivery rates, courier and payment settings, customer accounts.
- **Invoices**, collections (custom content types), portfolio, testimonials,
  sliders, pricing tables.
- **Site chat** for visitors, with an inbox in the dashboard.
- **AI tools** (optional): write and rewrite text, translate, build pages.
- **Backups**, import and export, and an importer for WordPress sites.

## Install with one prompt

Open your AI coding agent (Claude Code, OpenAI Codex, Cursor, Windsurf,
Gemini CLI or GitHub Copilot) in an empty folder and paste:

```text
Install Passive Coder CMS for me from https://github.com/PassiveCoderOfficial/PassiveCoderCMS: clone it and follow selfhost/AI-INSTALL.md step by step. Ask me where it should run first, never ask me to paste keys into this chat, and stop and ask before anything that costs money, needs a login or deletes something.
```

It asks where the site should run (Vercel + Supabase, your own server, or
this computer), sets up Supabase after you log in in your browser, deploys,
loads the database and opens the setup page. Keys go into a file on your
computer, never into the chat. Prompts per agent:
[selfhost/AI-PROMPTS.md](selfhost/AI-PROMPTS.md). Agent instructions:
[AGENTS.md](AGENTS.md) and [selfhost/AI-INSTALL.md](selfhost/AI-INSTALL.md).

Rather not do it yourself? We install it for you on your own accounts:
[cloud, $99](https://passivecoder.com/api/open-source/checkout?item=install_cloud) or
[your server, $199](https://passivecoder.com/api/open-source/checkout?item=install_server).

## Quick start

You need a Supabase project (supabase.com, the free plan works). Then pick
one way:

**One click, no server.** Deploy to Vercel, then open `/setup` on your new
site:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS&project-name=passivecoder-cms&repository-name=passivecoder-cms&env=NEXT_PUBLIC_SUPABASE_URL%2CNEXT_PUBLIC_SUPABASE_ANON_KEY%2CSUPABASE_SERVICE_ROLE_KEY%2CDATABASE_URL%2CSETUP_TOKEN%2CCRON_SECRET&envDescription=Four+values+from+your+Supabase+project%2C+and+two+passwords+you+make+up+now.+The+guide+shows+where+each+one+is.&envLink=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS%2Fblob%2Fmain%2Fselfhost%2FINSTALL-CLOUD.md%232-click-deploy)

**One command on a server** (Ubuntu 22.04+ or Debian 12+), with HTTPS,
scheduled jobs and daily backups:

```bash
curl -fsSL https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/main/selfhost/install.sh | sudo sh
```

**One command anywhere** with Node.js 22:

```bash
git clone https://github.com/PassiveCoderOfficial/PassiveCoderCMS.git && cd PassiveCoderCMS
node selfhost/cli/index.mjs init
```

Each way ends on a setup page that checks everything, sets up the database
and creates your admin login. Details: [selfhost/README.md](selfhost/README.md).

## AI features and the Passive Coder AI key

AI features are optional and off until you add a key. You can use a Passive
Coder AI key (`PASSIVECODER_AI_KEY`, one key for every AI feature, paid with
AI credits), or your own OpenRouter, OpenAI or Anthropic key for text
features. The CMS works fully without any of them.

## Paid modules

Some features of the hosted platform are not in this repository and are not
covered by this licence: multi-site hosting and billing, the partner and
white-label program, and paid modules such as marketplace, point of sale,
restaurant and food delivery, real estate, projects, accounting and others.
Where the core has a hook for one of them, this copy ships an empty stand-in
(see `src/modules/registry`), so everything here builds and runs on its own.
They are available on https://passivecoder.com or under a separate commercial
licence.

## Licence

Passive Coder CMS is free software under the
[GNU Affero General Public License v3](LICENSE). In short: you may use,
change and share it, and if you let other people use a changed version over a
network, you must offer them its source code under the same licence.

The name and logo "Passive Coder" are not part of that licence. See
[TRADEMARK.md](TRADEMARK.md) before you publish a fork or offer it as a
service.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
first; your first pull request needs a one-time acceptance of the
[Contributor License Agreement](CLA.md).

## Security

Please report security problems privately, not in a public issue. See
[SECURITY.md](SECURITY.md).
