# Install on your own server (one command)

This puts one Passive Coder CMS site on your own Linux server. The app runs
in Docker, with HTTPS, scheduled jobs and daily backups set up for you. The
database, logins and files stay on Supabase (supabase.com), which is the
simplest and safest choice.

Time: about 10 minutes.

## What you need

- A server (VPS) with **Ubuntu 22.04 or newer** or **Debian 12 or newer**,
  x86_64, with root or sudo access. 1 CPU and 1 GB of RAM is enough to
  start (2 GB is better); 10 GB of disk. A fresh server is best: ports 80
  and 443 must be free.
- A domain name, with access to its DNS settings.
- A Supabase project (supabase.com, the free plan works).

Nothing is built on the server: it downloads the ready-made app. (An ARM
server, or `--build`, builds the app on the server instead, which needs
about 8 GB of memory.)

## 1. Point your domain at the server

At your domain registrar, create an **A record** for your site's name (for
example `www`, or `@` for the bare domain) with the server's IP address.
If you want both `example.com` and `www.example.com`, point both at the
server: the installer makes the second one redirect to the first.

You can do this while the install runs. HTTPS starts by itself once the
domain points to the server.

## 2. Get four values from Supabase

In your Supabase project:

| Question | Where it is |
|---|---|
| Project URL | **Project Settings > API (Data API)**, like `https://abcdefgh.supabase.co` |
| Publishable key | **Project Settings > API Keys** (`sb_publishable_...`) |
| Secret key | Same page (`sb_secret_...`). Never share it. |
| Connection string | **Connect** (top of the project) > **Session pooler**. Replace `[YOUR-PASSWORD]` with your database password. |

## 3. Run the installer

Log in to the server with SSH and run:

```bash
curl -fsSL https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/main/selfhost/install.sh | sudo sh
```

It checks the server, installs Docker if needed, asks for your domain and
the four Supabase values (and checks them with Supabase), then sets up
everything in `/opt/passivecoder`. At the end it prints a link like:

```
https://www.example.com/setup#code=3f9c...
```

## 4. Finish in your browser

Open that link. The installer checks everything once more, then asks for
your admin email and password, the site name, language, time zone and
currency, and optional extras: a starter design, outgoing email (with a
test email), a Passive Coder AI key and a paid-modules licence. These are
saved on the server for you. Then `/setup` locks itself for good.

One more thing, in Supabase: **Authentication > URL Configuration**. Set
**Site URL** to your address and add `https://www.example.com/**` to
**Redirect URLs**, so password-reset links work.

## What is where

| | |
|---|---|
| `/opt/passivecoder/.env` | all settings and secret keys. Keep a copy somewhere safe. |
| `/opt/passivecoder/data/` | saved installer settings, `licence.json` |
| `/opt/passivecoder/backups/` | daily backups (newest 14 kept) |
| `/opt/passivecoder/install.sh` | run again to change settings |
| `/opt/passivecoder/update.sh` | install a new version |

Running parts: `app` (the site), `caddy` (HTTPS), `cron` (scheduled jobs).
See them with `docker compose -f /opt/passivecoder/compose.yml ps`.

## Change a setting

Edit `/opt/passivecoder/.env`, then run:

```bash
sudo sh /opt/passivecoder/install.sh
```

It asks only what is missing (press Enter to keep a value), keeps your
secret keys, and restarts the site. Changing the domain or the Supabase
project needs nothing else: there is no rebuild.

## Updates

```bash
sudo sh /opt/passivecoder/update.sh
```

It makes a backup, downloads the new version, updates the database, and
restarts. If the database update fails, the site keeps running the old
version.

## Backups

Every night at 03:30 (server time) `backup.sh` saves a copy of the
database (`db-*.sql.gz`) and of your settings and data folder
(`files-*.tar.gz`). Run it by hand any time:

```bash
sudo sh /opt/passivecoder/backup.sh
```

Copy the backups off the server now and then (they hold customer data and
keys: keep them private). Uploaded images live in Supabase Storage; the
app's own backup (Dashboard > Backups) covers your pages, products, orders
and files. Supabase paid plans also keep daily database backups.

The database copy is plain SQL (the `public`, `auth` and `storage`
schemas). To restore it into a new Supabase project, follow Supabase's
guide "Backup and restore using the CLI"; test a restore once, before you
need it.

## No questions (for scripts)

Every answer can be an option (or environment variable). With `--yes`
nothing is asked:

```bash
curl -fsSL https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/main/selfhost/install.sh | sudo sh -s -- --yes \
  --domain www.example.com \
  --supabase-url https://abcdefgh.supabase.co \
  --anon-key sb_publishable_... \
  --service-key sb_secret_... \
  --database-url 'postgresql://postgres.abcdefgh:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres'
```

More: `--email` (for HTTPS certificate notices), `--build` (build on the
server), `--dir` (another folder than `/opt/passivecoder`). Environment
names: `PC_DOMAIN`, `PC_SUPABASE_URL`, `PC_ANON_KEY`, `PC_SERVICE_KEY`,
`PC_DATABASE_URL`, `PC_EMAIL`, `PC_BUILD=1`, `PC_DIR`, `PC_YES=1`.

## Paid modules (licence)

Upload `licence.json` in the web installer. Later, or by hand:

```bash
sudo cp licence.json /opt/passivecoder/data/licence.json
sudo chown 1001:1001 /opt/passivecoder/data/licence.json
sudo sh /opt/passivecoder/update.sh --restart
```

The modules appear under **Dashboard > Modules**. The licence is checked
inside your server, with no call to Passive Coder. If the app cannot use it,
the log says why and the site keeps working with the free modules:
`docker compose -f /opt/passivecoder/compose.yml logs app | grep licence`.

## Moving a site from Passive Coder hosting

Do this after step 3 and **before** step 4 (opening `/setup`):

```bash
cd /opt/passivecoder
# copy the package folder to the server first (for example with scp), then:
sudo mv <package folder> data/import && sudo chown -R 1001:1001 data/import
sudo docker compose run --rm app node selfhost/import-site.mjs /app/data/import --dry-run
sudo docker compose run --rm app node selfhost/import-site.mjs /app/data/import --owner-password '<new password>'
sudo rm -rf data/import
```

The package holds customer data and keys: delete it once the site works.

## Something wrong?

- **Before setup is finished**, open `https://<your domain>/setup`: its
  system check names each problem and the fix.
- **See what the app says**: `docker compose -f /opt/passivecoder/compose.yml logs --tail 100 app`
- **No HTTPS**: check the domain points to this server
  (`getent hosts www.example.com`) and that ports 80 and 443 are open in
  your provider's firewall. Then look at `... logs caddy`.
- **Jobs do not run**: `... logs cron`. A `401` means `CRON_SECRET` differs;
  run `install.sh` again to restart everything with the same settings.
- **"Port 80 is used by apache2/nginx"**: this install brings its own web
  server. Use a fresh server, or stop the other one first.

## Without the installer

If you prefer to do it by hand (your own reverse proxy, another Linux, or a
Docker host you already run), use `Dockerfile` and `docker-compose.yml` in
the code:

```bash
git clone https://github.com/PassiveCoderOfficial/PassiveCoderCMS.git && cd PassiveCoderCMS
node selfhost/cli/index.mjs init --no-start   # asks the questions, writes .env.local, loads the database
docker compose build                          # about 8 GB of memory; or set PC_IMAGE to the ready-made image
docker compose --profile https up -d          # without --profile https if you have your own proxy
```

The image built there is the ready-made kind: settings go in when the
container starts, so changing `.env.local` needs a restart, not a build.
