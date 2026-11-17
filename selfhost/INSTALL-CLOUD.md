# Install on Vercel + Supabase (one click, no server)

This puts one Passive Coder CMS site on Vercel (the app) and Supabase (the
database, logins and files). There is no server to look after and no
terminal. Both have free plans that are enough to start.

Time: about 15 minutes, most of it waiting for the first build.

You need a GitHub account, a Vercel account and a Supabase account. A domain
name is optional: you can start on the free `*.vercel.app` address.

## 1. Create the Supabase project

1. In Supabase, click **New project**. Pick the region closest to your
   visitors. Choose a database password and save it somewhere safe.
2. Keep the project open. The next step asks for four values from it:

| What Vercel asks | Where it is in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings > API (Data API)**: Project URL, like `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings > API Keys**: the **publishable** key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page: the **secret** key (`sb_secret_...`). Never share it. |
| `DATABASE_URL` | **Connect** (top of the project) > **Session pooler**. Replace `[YOUR-PASSWORD]` with your database password. |

## 2. Click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS&project-name=passivecoder-cms&repository-name=passivecoder-cms&env=NEXT_PUBLIC_SUPABASE_URL%2CNEXT_PUBLIC_SUPABASE_ANON_KEY%2CSUPABASE_SERVICE_ROLE_KEY%2CDATABASE_URL%2CSETUP_TOKEN%2CCRON_SECRET&envDescription=Four+values+from+your+Supabase+project%2C+and+two+passwords+you+make+up+now.+The+guide+shows+where+each+one+is.&envLink=https%3A%2F%2Fgithub.com%2FPassiveCoderOfficial%2FPassiveCoderCMS%2Fblob%2Fmain%2Fselfhost%2FINSTALL-CLOUD.md%232-click-deploy)

Vercel makes your own copy of the code on GitHub, then asks for six values:

- the four from the table above;
- `SETUP_TOKEN`: make up a password (letters and numbers, 16 or more). The
  setup page asks for it, so nobody else can set up your site first.
- `CRON_SECRET`: make up another long password. Vercel uses it to run the
  scheduled jobs (backups, reminders, scheduled posts).

Click **Deploy**. The first build takes 10 to 20 minutes.

You do not type your site's address anywhere: the app takes it from Vercel
when it is built.

## 3. Finish in your browser

When Vercel says the deploy is ready, open the site and go to `/setup`
(for example `https://passivecoder-cms.vercel.app/setup`). Enter your setup
code. The installer then:

1. checks everything and says, in plain words, how to fix anything wrong;
2. sets up the database with one button (about a minute);
3. creates your admin login and your site: name, language, time zone and
   currency;
4. optionally: a starter design, outgoing email (with a test email), a
   Passive Coder AI key, and a paid-modules licence.

After that, `/setup` locks itself for good.

On Vercel, the installer cannot save settings by itself. When you add email,
an AI key or a licence, the last screen lists the exact variables to add in
Vercel (**Settings > Environment Variables**), then **Redeploy**.

## 4. Your own domain (optional)

1. In Vercel: **Settings > Domains**, add your domain, and set the DNS
   records Vercel shows at your domain registrar. HTTPS is automatic.
2. **Deployments** > the three dots on the newest one > **Redeploy**. The
   app picks up the new address.
3. In Supabase: **Authentication > URL Configuration**. Set **Site URL** to
   `https://www.example.com` and add `https://www.example.com/**` to
   **Redirect URLs**. Without this, password-reset links point to the old
   address.

Supabase's built-in email sender allows only a few emails an hour. For a
real site, set your own SMTP server in Supabase under
**Authentication > Emails > SMTP Settings**.

## Why "Redeploy" after some changes

Settings whose name starts with `NEXT_PUBLIC_` (the Supabase address and
public key, the site address) are written into the app when Vercel builds
it. After changing one, redeploy. The installer's system check notices a
mismatch and tells you.

## Scheduled jobs

The `vercel.json` in the code lists them. On the Vercel **Hobby** (free)
plan, jobs can run only once a day, so scheduled blog posts go live once a
day. On **Pro**, change the `publish-scheduled` line to `*/15 * * * *`.

## Paid modules (licence)

Upload `licence.json` in the installer: it checks the file and shows the
value to add in Vercel. Later, or by hand:

1. Turn the file into one line of text:
   - macOS / Linux: `base64 -w0 licence.json` (macOS: `base64 -i licence.json`)
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("licence.json"))`
2. In Vercel, add the variable `PASSIVECODER_LICENCE` with that text.
3. Redeploy. The modules appear under **Dashboard > Modules**.

The licence is checked inside your app, with no call to Passive Coder. If it
does not match your domain, the site keeps working with the free modules.

## Updates

1. On GitHub, open your copy of the code and click **Sync fork** (or pull
   the new version into it). Vercel builds and deploys by itself.
2. Apply the database changes the new version brings, from any computer
   with Node.js 22 and a copy of the code:

   ```bash
   npm ci
   node selfhost/cli/index.mjs update --no-build
   ```

   It reads `DATABASE_URL` from `.env.local` (or the environment). To see
   what would change first: `node selfhost/migrate.mjs --dry-run`.

If a deploy goes wrong, open **Deployments** in Vercel and click
**Promote** on the previous one.

## Moving a site from Passive Coder hosting

Do this on a fresh install, **before** finishing `/setup`. On your computer,
with `.env.local` filled in (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `COURIER_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`):

```bash
node selfhost/import-site.mjs <package folder> --dry-run
node selfhost/import-site.mjs <package folder> --owner-password '<new password>'
```

Add the same `COURIER_SECRET_KEY` in Vercel. If the package has a licence,
follow "Paid modules" above with it. Delete the package when the site works:
it holds customer data.

## Backups

- **In the app**: Dashboard > Backups makes a backup every night and lets
  you download your pages, products, orders and files.
- **Supabase**: paid plans keep daily database backups. On the free plan,
  download your own copy now and then:

  ```bash
  docker run --rm postgres:17 pg_dump "<your DATABASE_URL>" --no-owner -Fc > site-$(date +%F).dump
  ```
- Keep a copy of your Vercel environment variables somewhere safe. Without
  `COURIER_SECRET_KEY`, saved payment and courier keys cannot be read.

## Something wrong?

Open `/setup` while the site is not set up yet: its system check names the
problem and the fix. After setup:

- **"Database unavailable"**: check the Supabase variables, and that the
  project is not paused (free projects pause after a week without visits:
  open it in Supabase and click **Restore**).
- **Jobs do not run**: check `CRON_SECRET` is set, and look at
  **Settings > Cron Jobs** in Vercel.
