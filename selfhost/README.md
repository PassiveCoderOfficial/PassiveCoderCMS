# Self-hosting Passive Coder CMS (single site)

Work in progress for the open-source edition. This folder holds what a
self-hosted install needs besides the app itself.

## Install guides

- `INSTALL-CLOUD.md`: Vercel + Supabase. No server to look after.
- `INSTALL-SERVER.md`: your own Ubuntu server with Docker, HTTPS by Caddy,
  backups and updates. Uses `Dockerfile` and `docker-compose.yml` in the
  repo root.

## Files

- `.env.example`: every setting, required ones first.
- `schema.sql`: the whole database (loaded by `setup-db.mjs`).
- `setup-db.mjs`, `migrate.mjs`: first load, and updates after a new version.
- `import-site.mjs`: load a site package when moving from Passive Coder hosting.
- `vercel.json`: the self-host job list for Vercel (copy it over the root
  `vercel.json` in your own copy; see INSTALL-CLOUD.md).
- `crontab.example`: the scheduled jobs (backups, CRM reminders, booking
  reminders, scheduled posts and so on) for a VPS or Docker install. Vercel
  runs them from `vercel.json` by itself.

## First run

1. Create a Supabase project. Put its database connection string
   (Project Settings > Database, "Session pooler") in `DATABASE_URL`, then
   load the database once:

   ```bash
   node selfhost/setup-db.mjs
   ```
2. Fill in `.env.example` as `.env.local` (or your host's settings).
3. Start the app and open your site: it sends you to `/setup`, where you
   create the admin account and name the site. `/setup` locks itself after
   that. Set `SETUP_TOKEN` (any long random string) before the first start if
   the install is reachable from the internet: `/setup` then asks for it as
   the "Setup code", so nobody else can claim the install first. Setup always
   creates a new admin account; it never changes an existing account.

## Updating

After getting a new version, run the database changes it brings, then
restart the app:

```bash
node selfhost/migrate.mjs            # add --dry-run to see what it would do
```

## AI

- **Passive Coder AI** (recommended): set `PASSIVECODER_AI_KEY`. Every AI
  feature, including building a whole site, paid with AI credits.
- **Own key** (advanced): `OPENROUTER_API_KEY`, `OPENAI_API_KEY` or
  `ANTHROPIC_API_KEY`. Writing and rewriting text and the site chat; building a
  whole site needs Passive Coder AI.

## Scheduled jobs on a VPS

With Docker, the `cron` service in `docker-compose.yml` runs them for you.
Without Docker, edit `SITE_URL` and `CRON_SECRET` at the top of
`crontab.example` (the same `CRON_SECRET` as the app), then install it with
`crontab -e`.

## Paid modules (licence)

Paid modules are turned on by a `licence.json` signed by Passive Coder for
one site (its domain and site id). The app checks it offline at start-up,
with no call to Passive Coder; without a valid one the site runs with the
free core modules. Put it in the app folder (Docker: `data/licence.json`),
or its contents in `PASSIVECODER_LICENCE` (Vercel). Terms:
`LICENSE-MODULES.txt`. Passive Coder makes licences with
`scripts/licence/sign-licence.mjs`.

## Moving a site from Passive Coder hosting

Ask for it in your dashboard (Settings > Move to self-host; the site owner
only). Passive Coder gives you a site package: a zip holding one folder with
your pages, products, orders, bookings, contacts, settings, files (form
uploads and project files included) and logins. Unzip it, then on a fresh
install, before opening `/setup`:

```bash
node selfhost/import-site.mjs <package folder> --owner-password '<new password>'
```

Add `--dry-run` first to check it without writing anything. The owner signs in
with the new password; everyone else uses "Forgot password". Payment and
courier keys come across (set `COURIER_SECRET_KEY` first); connect Google again
and point your domain at the new server. Form uploads, project files, chat
training files and seller documents go into private storage buckets, as on
Passive Coder hosting. The package holds customer data and keys: keep it
private and delete it once the site runs.

For Passive Coder staff: Super Admin > Self-host builds the package as a zip
in the private `site-packages` bucket and gives a signed download link. A
site too large for one server run (over 300 MB of files, or too slow) is
marked so there; build it with the CLI instead, on a machine with the
platform's `.env.local`:

```bash
node scripts/site-move/export-site.mjs --site <slug> --out <folder>
```
