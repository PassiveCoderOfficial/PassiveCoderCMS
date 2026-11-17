# Install on Vercel + Supabase (cloud)

This guide puts one Passive Coder CMS site on Vercel (the app) and Supabase
(the database, logins and files). There is no server to look after. Both
have free plans that are enough to try it.

Time: about 45 minutes.

## What you need

- A GitHub account, with your own private copy of the Passive Coder CMS code.
- A Vercel account (vercel.com).
- A Supabase account (supabase.com).
- A domain name, and access to its DNS settings.
- A computer with Node.js 22 or later, to load the database once.

## 1. Create the Supabase project

1. In Supabase, click **New project**. Pick the region closest to your
   visitors. Save the database password somewhere safe.
2. Open **Project Settings > API**. Copy three values:
   - Project URL (`https://xxxx.supabase.co`)
   - the **publishable** key (`sb_publishable_...`)
   - the **secret** key (`sb_secret_...`). Never share this one.
3. Click **Connect** at the top of the project. Copy the **Session pooler**
   connection string. Put your database password into it.

## 2. Load the database

On your computer, in the code folder:

```bash
npm ci
cp selfhost/.env.example .env.local
```

Open `.env.local`. Fill in at least `DATABASE_URL` (the connection string
from step 1.3). Then:

```bash
node selfhost/setup-db.mjs
```

It prints `database ready` when done. It refuses to run twice on the same
database, so you cannot overwrite a site by mistake.

## 3. Use the self-host job list

The `vercel.json` in the code belongs to the hosted platform. Replace it with
the self-host one, and commit the change to your copy:

```bash
cp selfhost/vercel.json vercel.json
git commit -am "Use the self-host scheduled jobs"
git push
```

On the Vercel **Hobby** (free) plan, jobs can run only once a day. So
scheduled blog posts go live once a day, at 01:00 UTC. On **Pro**, change
the `publish-scheduled` line in `vercel.json` to `*/15 * * * *` (every 15
minutes).

## 4. Create the Vercel project

1. In Vercel, click **Add New > Project** and import your copy from GitHub.
2. Framework: **Next.js**. Leave the build settings as they are.
3. Open **Environment Variables** and add these. Make up each secret with
   `openssl rand -base64 32` (or any password generator, 32+ characters).

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CMS_MODE` | `standalone` |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from step 1.2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key |
| `NEXT_PUBLIC_ROOT_DOMAIN` | your domain, no `https://` (e.g. `www.example.com`) |
| `NEXT_PUBLIC_APP_URL` | your full address (e.g. `https://www.example.com`) |
| `APP_SECRET` | a new random secret |
| `CRON_SECRET` | a new random secret (Vercel sends it to the jobs) |
| `COURIER_SECRET_KEY` | exactly 32 random bytes: `openssl rand -base64 32` |

Optional ones (email, AI, maps and more) are listed in
`selfhost/.env.example`. Add `RESEND_API_KEY` and `EMAIL_FROM` if you want
form notifications by email. You can add the rest later.

4. Click **Deploy**. The first build takes 10 to 20 minutes.

Settings that start with `NEXT_PUBLIC_` are built into the app. If you
change one later, redeploy.

## 5. Connect your domain

1. In Vercel, open the project, **Settings > Domains**, and add your domain.
2. Set the DNS records Vercel shows you, at your domain registrar.
3. Wait until Vercel shows the domain as valid. HTTPS is automatic.

## 6. Tell Supabase your address

In Supabase, open **Authentication > URL Configuration**:

- **Site URL**: your full address, e.g. `https://www.example.com`.
- **Redirect URLs**: add `https://www.example.com/**`.

Without this, password reset links point to the wrong place.

Supabase's built-in email sender allows only a few emails an hour. For a
real site, set your own SMTP server under **Authentication > Emails > SMTP
Settings**.

## 7. First run

Open your domain. It sends you to `/setup`. Enter your email, a password and
the site name. This creates your admin login and the site. After that,
`/setup` locks itself.

## Paid modules (licence)

If you bought paid modules, Passive Coder gives you a `licence.json` file.
It works for your domain only.

1. Turn the file into one line of text:
   - macOS / Linux: `base64 -w0 licence.json` (macOS: `base64 -i licence.json`)
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("licence.json"))`
2. In Vercel, add the variable `PASSIVECODER_LICENCE` with that text.
3. Redeploy. The modules appear under **Dashboard > Modules**.

The licence is checked inside your app, with no call to Passive Coder. If it
does not match your domain, the site keeps working with the free modules.

## Moving a site from Passive Coder hosting

Do this on a fresh install, **before** step 7 (`/setup`). On your computer,
with `.env.local` filled in (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `COURIER_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`):

```bash
node selfhost/import-site.mjs <package folder> --dry-run
node selfhost/import-site.mjs <package folder> --owner-password '<new password>'
```

If the package has a licence, the import copies it to `licence.json`. On
Vercel, follow "Paid modules" above with that file instead. Delete the
package when the site works: it holds customer data.

## Updates

1. Get the new version into your copy of the code.
2. On your computer, update the database first:

   ```bash
   node selfhost/migrate.mjs --dry-run   # shows what will change
   node selfhost/migrate.mjs
   ```
3. Push to GitHub. Vercel builds and deploys by itself.

If a deploy goes wrong, open **Deployments** in Vercel and click
**Promote** on the previous one.

## Backups

- **In the app**: Dashboard > Backups makes a backup every night (the
  `backups` job) and lets you download your pages, products, orders and
  files.
- **Supabase**: paid plans keep daily database backups. On the free plan,
  download your own copy now and then:

  ```bash
  docker run --rm postgres:17 pg_dump "<your DATABASE_URL>" --no-owner -Fc > site-$(date +%F).dump
  ```
- Keep a copy of your environment variables and `licence.json` somewhere
  safe. Without `COURIER_SECRET_KEY`, saved payment and courier keys cannot
  be read.

## Something wrong?

- **"Database unavailable"**: check `NEXT_PUBLIC_SUPABASE_URL` and the keys,
  and that the Supabase project is not paused (free projects pause after a
  week without visits).
- **The site sends you to `/setup` again**: the app cannot see the site row.
  Check that every variable points at the same Supabase project.
- **Jobs do not run**: check `CRON_SECRET` is set, and look at
  **Settings > Cron Jobs** in Vercel.
