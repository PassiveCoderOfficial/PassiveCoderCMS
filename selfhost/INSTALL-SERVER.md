# Install on your own server (Docker)

This guide puts one Passive Coder CMS site on your own Linux server with
Docker. The database, logins and files stay on Supabase (supabase.com), which
is the simplest and safest choice. Running Supabase on your own server is
possible but is not covered here.

Time: about 1 to 2 hours, most of it waiting for the build.

## What you need

- A server (VPS) with **Ubuntu 22.04 or later**, and root or sudo access.
  - To run the site: 2 CPU cores, 2 GB RAM (4 GB is better), 20 GB disk.
  - To build the app on the same server: 8 GB of RAM, or 4 GB plus 8 GB of
    swap (step 4). You can also build on another machine (see "Build
    elsewhere").
- A domain name, with access to its DNS settings.
- A Supabase account.
- Your private copy of the Passive Coder CMS code on GitHub.

## 1. Point your domain at the server

At your domain registrar, create an **A record** for your site's name (for
example `www`) with the server's IP address. Add an **AAAA record** too if
the server has IPv6. DNS changes can take up to an hour.

## 2. Install Docker and a firewall

Log in to the server with SSH, then:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # log out and back in after this

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

The app itself listens only inside the server (port 3000 on 127.0.0.1). The
world reaches it through HTTPS on ports 80 and 443.

## 3. Get the code

```bash
sudo mkdir -p /opt/passivecoder && sudo chown $USER /opt/passivecoder
git clone <your private copy's address> /opt/passivecoder
cd /opt/passivecoder
mkdir -p data && sudo chown 1001:1001 data
```

`data/` holds your licence file and site packages to import. The app runs
as user 1001, so it must own the folder.

## 4. Add swap (only if the server has less than 8 GB RAM)

```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Create the Supabase project

1. In Supabase, click **New project**. Pick the region closest to your
   server. Save the database password.
2. **Project Settings > API**: copy the Project URL, the **publishable** key
   and the **secret** key.
3. **Connect** (top of the project): copy the **Session pooler** connection
   string, with your password in it.
4. **Authentication > URL Configuration**: set **Site URL** to your address
   (`https://www.example.com`) and add `https://www.example.com/**` to
   **Redirect URLs**.
5. For a real site, set your own SMTP server under **Authentication >
   Emails > SMTP Settings**. The built-in sender allows only a few emails an
   hour.

## 6. Settings

```bash
cp selfhost/.env.example .env.local
chmod 600 .env.local
nano .env.local
```

Fill in everything under **Required**, and `DATABASE_URL`. Make each secret
with `openssl rand -base64 32`. `NEXT_PUBLIC_ROOT_DOMAIN` must be exactly the
name from step 1 (for example `www.example.com`): the HTTPS step uses it.

Settings that start with `NEXT_PUBLIC_` are built into the app. If you
change one later, build again (step 7).

## 7. Build

```bash
docker compose build
```

This takes 15 to 40 minutes. It builds two images: the web app and a small
one that runs the scheduled jobs. Your `.env.local` is used during the build
but is not stored in the image.

## 8. Load the database (first time only)

```bash
docker compose run --rm app node selfhost/setup-db.mjs
```

It prints `database ready`. It refuses to run on a database that already
has the tables, so you cannot overwrite a site by mistake.

## 9. Start

```bash
docker compose --profile https up -d
docker compose ps
```

You should see three services running: `app`, `cron` and `caddy`. Caddy
gets the HTTPS certificate by itself within a minute and renews it
automatically.

Open `https://<your domain>`. It sends you to `/setup`. Enter your email, a
password and the site name. After that, `/setup` locks itself.

### Both www and the bare domain

The built-in HTTPS service covers one name. To serve `example.com` and
`www.example.com` (one redirecting to the other), create a file named
`Caddyfile`:

```
www.example.com {
    reverse_proxy app:3000
}
example.com {
    redir https://www.example.com{uri} permanent
}
```

Point both names at the server (step 1), then add this to the `caddy`
service in `docker-compose.yml`:

```yaml
    command: caddy run --config /etc/caddy/Caddyfile
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
```

### Already have nginx or another proxy?

Skip the `--profile https` part. Point your proxy at `http://127.0.0.1:3000`
and pass the `Host` and `X-Forwarded-*` headers.

## Scheduled jobs

The `cron` service calls the app's jobs (nightly backup, reminders,
scheduled posts and so on) on the times in `selfhost/crontab.example`,
using your `CRON_SECRET`. Times are UTC. Check them with:

```bash
docker compose logs cron --tail 50
```

## Paid modules (licence)

If you bought paid modules, Passive Coder gives you a `licence.json` file.
It works for your domain only.

```bash
cp licence.json /opt/passivecoder/data/licence.json
sudo chown 1001:1001 /opt/passivecoder/data/licence.json
docker compose restart app
```

The modules appear under **Dashboard > Modules**. The licence is checked
inside your server, with no call to Passive Coder. If the app cannot use it,
the log says why and the site keeps working with the free modules:

```bash
docker compose logs app | grep licence
```

## Moving a site from Passive Coder hosting

Do this on a fresh install, after step 8 and **before** opening `/setup`.

```bash
# copy the package folder to the server first, e.g. with scp, then:
sudo mv <package folder> /opt/passivecoder/data/import
sudo chown -R 1001:1001 /opt/passivecoder/data/import
docker compose run --rm app node selfhost/import-site.mjs /app/data/import --dry-run
docker compose run --rm app node selfhost/import-site.mjs /app/data/import --owner-password '<new password>'
```

If the package has a licence, the import puts it in `data/licence.json` for
you. Then start the site (step 9). When it works, delete the package:

```bash
sudo rm -rf /opt/passivecoder/data/import
```

It holds customer data and keys.

## Backups

Keep three things safe:

1. **The database.** Supabase paid plans keep daily backups. Also keep your
   own copy. Create `/opt/passivecoder/backup.sh`:

   ```bash
   #!/bin/sh
   set -e
   cd /opt/passivecoder
   mkdir -p backups
   DB=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
   docker run --rm postgres:17 pg_dump "$DB" --no-owner -Fc > backups/db-$(date +%F).dump
   find backups -name 'db-*.dump' -mtime +14 -delete
   ```

   Then run it every night at 03:00:

   ```bash
   chmod +x /opt/passivecoder/backup.sh
   (crontab -l 2>/dev/null; echo "0 3 * * * /opt/passivecoder/backup.sh") | crontab -
   ```

   Copy the `backups` folder off the server now and then (another machine
   or cloud storage). A backup on the same server is lost with the server.
2. **Files** (images and uploads) live in Supabase Storage. **Dashboard >
   Backups** in the app makes a nightly backup and lets you download your
   pages, products, orders and files.
3. **`.env.local` and `data/licence.json`.** Without `COURIER_SECRET_KEY`,
   saved payment and courier keys cannot be read.

To restore the database into a new, empty Supabase project:

```bash
docker run --rm -i postgres:17 pg_restore --no-owner -d "<new DATABASE_URL>" < backups/db-YYYY-MM-DD.dump
```

## Updates

```bash
cd /opt/passivecoder
docker tag passivecoder-cms:latest passivecoder-cms:previous    # keep the old version
git pull
docker compose build
docker compose run --rm app node selfhost/migrate.mjs --dry-run   # shows what will change
docker compose run --rm app node selfhost/migrate.mjs
docker compose --profile https up -d
```

To go back to the old version of the app:

```bash
docker tag passivecoder-cms:previous passivecoder-cms:latest
docker compose --profile https up -d
```

Database changes are made to add things, so the old app version keeps
working with them. Take a database backup before every update anyway.

## Build elsewhere

Building needs about 8 GB of RAM. If your server is smaller, build the
images on GitHub instead: `.github/workflows/selfhost-image.yml` does it.

1. In your GitHub copy, set the repository variables the workflow file
   lists (`NEXT_PUBLIC_SUPABASE_URL` and the others).
2. Run **Actions > Self-host image** with **Push** ticked. GitHub's
   standard runners may not have enough memory: set `SELFHOST_RUNNER` to a
   larger runner if the build stops with "out of memory".
3. On the server, log in to the registry
   (`docker login ghcr.io`, with a GitHub token that can read packages) and
   create `/opt/passivecoder/.env` with:

   ```
   PC_IMAGE=ghcr.io/<owner>/<repo>:latest
   PC_CRON_IMAGE=ghcr.io/<owner>/<repo>-cron:latest
   ```
4. Use `docker compose pull` instead of `docker compose build`.

## Something wrong?

- **See what the app says**: `docker compose logs app --tail 100`.
- **"Database unavailable"**: check the Supabase URL and keys in
  `.env.local`, and that the project is not paused.
- **The build stops with "Killed" or "heap out of memory"**: the server
  needs more memory. Add swap (step 4) or build elsewhere.
- **No HTTPS certificate**: check the domain points at this server
  (`dig +short www.example.com`) and ports 80 and 443 are open. Then
  `docker compose logs caddy`.
- **Jobs do not run**: `docker compose logs cron`. A `401` means
  `CRON_SECRET` differs between the app and the job runner; both read it
  from `.env.local`, so restart both after changing it.
