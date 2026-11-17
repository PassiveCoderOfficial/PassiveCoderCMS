# create-passivecoder

The command-line installer for Passive Coder CMS (self-hosted, one site).

Inside a copy of the code:

```bash
node selfhost/cli/index.mjs init      # set up a new install
node selfhost/cli/index.mjs doctor    # check an install
node selfhost/cli/index.mjs start     # build if needed, then run
node selfhost/cli/index.mjs update    # new version + database updates
```

For AI coding agents (none of these prints a key or password; see
[../AI-INSTALL.md](../AI-INSTALL.md)):

```bash
node selfhost/cli/index.mjs doctor --json        # checks as JSON: id, status, message, fix, docs
node selfhost/cli/index.mjs doctor --redact      # same, addresses and hosts hidden (for an issue)
node selfhost/cli/index.mjs env-slots            # empty slots + missing secrets in .env.local
node selfhost/cli/index.mjs env-status           # set / empty per setting
node selfhost/cli/index.mjs supabase-create --org-id <id> --region <region> --confirm
node selfhost/cli/index.mjs supabase-keys --region <region>   # URL, keys, DATABASE_URL into .env.local
node selfhost/cli/index.mjs vercel-env           # settings to the linked Vercel project (stdin)
node selfhost/cli/index.mjs open-setup --url https://your-site
```

The setup code is not printed when the output is not a terminal (or with
`--hide-code`). Use `--settings-file <path>` for another settings file
(Node.js itself claims `--env-file`).

It has no packages of its own. Run from outside a copy of the code, it
downloads the code first and carries on inside it. That is how the npm
package will work once it is published (`npx create-passivecoder my-site`);
it is not on npm yet (`"private": true` in package.json stops a publish by
mistake).

Full guide: [../README.md](../README.md).
