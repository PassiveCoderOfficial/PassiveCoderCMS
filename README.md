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

## Quick start

You need Node.js 20 or newer and a Supabase project (the free plan works).

1. `npm ci`
2. Copy `.env.example` to `.env.local` and fill in the required settings.
3. Load the database: `node selfhost/setup-db.mjs`
4. `npm run build`, then `npm start`
5. Open the site and finish the setup screen to create the owner account.

The full guide, including updates and scheduled jobs, is in
[selfhost/README.md](selfhost/README.md). If this repository has `INSTALL`
guides for a specific host (for example `selfhost/INSTALL-*.md`), follow the
one for your host.

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
