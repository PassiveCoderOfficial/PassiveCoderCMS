/**
 * English text for the install checks, for the terminal (`passivecoder
 * doctor`, install.sh). The web installer has its own copies in the i18n
 * files (installer.check.* and installer.fix.*), in English and Bangla;
 * tests/installer/checks.test.ts makes sure no code is missing from either.
 *
 * {name} parts are filled in from the result's params.
 */
/** @type {Record<string, string>} */
export const CHECK_TITLES = {
  settings: "Settings",
  build: "App build",
  supabase: "Supabase project",
  service_key: "Supabase secret key",
  database: "Database connection",
  schema: "Database tables",
  storage: "File storage",
  secrets: "Secret keys",
  setup_code: "Setup code",
  cron: "Scheduled jobs",
  email: "Outgoing email",
  address: "Site address",
};

/** @type {Record<string, string>} */
export const CHECK_MESSAGES = {
  settings_ok: "All required settings are present.",
  settings_missing: "These settings are missing: {names}. Add them, then check again.",
  needs_settings: "Waiting for the settings above.",

  build_ok: "The app was built with the current settings.",
  build_stale: "The app was built with older values of: {names}. Run the installer again and it rebuilds the app for you.",

  supabase_ok: "Your Supabase project answers and accepts the public key.",
  supabase_url_not_a_url: "NEXT_PUBLIC_SUPABASE_URL is not a web address. It looks like https://abcdefgh.supabase.co (Supabase: Project Settings > API > Project URL).",
  supabase_url_dashboard_link: "NEXT_PUBLIC_SUPABASE_URL is a link to the Supabase dashboard. Use the Project URL instead (Project Settings > API), like https://abcdefgh.supabase.co.",
  supabase_url_has_path: "NEXT_PUBLIC_SUPABASE_URL has extra text after the address. Keep only https://abcdefgh.supabase.co.",
  supabase_unreachable: "Your Supabase project does not answer. Check the Project URL, and that the project is not paused (free projects pause after a week without use: open it in Supabase and click Restore).",
  anon_key_invalid: "Supabase refuses the public key. Copy the publishable key again (Project Settings > API keys) into NEXT_PUBLIC_SUPABASE_ANON_KEY. It must be from the same project as the URL.",
  anon_key_is_secret: "NEXT_PUBLIC_SUPABASE_ANON_KEY holds a SECRET key. This value is shown to every visitor. Put the publishable key there, and make a new secret key in Supabase because this one may have leaked.",

  service_key_ok: "The secret key works.",
  service_key_missing: "SUPABASE_SERVICE_ROLE_KEY is missing. It is the secret key (sb_secret_...) from Supabase: Project Settings > API keys.",
  service_key_is_public: "SUPABASE_SERVICE_ROLE_KEY holds the publishable key. Put the secret key (sb_secret_...) there.",
  service_key_invalid: "Supabase refuses the secret key. Copy it again from Project Settings > API keys. It must be from the same project as the URL.",
  service_key_unknown: "Could not confirm the secret key just now. Check again in a minute.",
  needs_supabase: "Waiting for the Supabase project to answer.",

  database_ok: "Connected to the database.",
  database_not_checked: "Not checked here (the database driver is not installed yet). Run npm ci, then check again.",
  database_url_missing: "DATABASE_URL is missing. It is needed once, to create the tables. In Supabase click Connect (top of the project), copy the \"Session pooler\" connection string and put your database password into it.",
  database_url_missing_later: "DATABASE_URL is not set. The site works without it; you will need it to install updates.",
  database_url_not_a_url: "DATABASE_URL is not a connection string. It looks like postgresql://postgres.abcdefgh:password@aws-0-region.pooler.supabase.com:5432/postgres.",
  database_url_not_postgres: "DATABASE_URL must start with postgresql://. Copy the \"Session pooler\" connection string from Supabase > Connect.",
  database_url_password_placeholder: "DATABASE_URL still has [YOUR-PASSWORD] in it. Replace that part with your database password (no brackets).",
  database_url_no_password: "DATABASE_URL has no password in it. Put your database password after the colon: postgresql://user:PASSWORD@host...",
  database_auth: "The database refuses the password in DATABASE_URL. Reset it in Supabase (Project Settings > Database > Reset database password) and put the new one in. Special characters in the password must be URL-encoded (@ becomes %40).",
  database_project: "The database does not know this project or user. Copy the connection string again from Supabase > Connect (\"Session pooler\").",
  database_host: "The database address in DATABASE_URL cannot be found. Copy the connection string again from Supabase > Connect (\"Session pooler\").",
  database_network: "Could not reach the database. Use the \"Session pooler\" connection string (the \"Direct connection\" one needs IPv6, which many servers do not have).",
  database_other: "Could not connect to the database. Copy the \"Session pooler\" connection string again from Supabase > Connect.",
  database_transaction_pooler: "DATABASE_URL uses the \"Transaction pooler\" (port 6543). It works, but updates are safer on the \"Session pooler\" (port 5432).",

  schema_ok: "All tables are in place and up to date.",
  schema_empty: "The database is empty. Set it up now: it takes about a minute.",
  schema_foreign: "This database already holds other tables. Passive Coder CMS needs its own, new Supabase project: create one and use its details.",
  schema_missing_no_url: "The tables are not there yet. Add DATABASE_URL (see \"Database connection\") so the installer can create them.",
  schema_missing_no_db: "The tables are not there yet, and the database connection does not work. Fix \"Database connection\" first.",
  schema_unknown: "Could not look at the tables yet. Fix the items above first.",
  schema_version_unknown: "The tables are there, but their version could not be read. Run the update once the database connection works.",
  schema_pending: "The tables are there. {count} update(s) from this version are waiting to be applied.",
  needs_schema: "Waiting for the database tables.",

  storage_ok: "All storage folders (buckets) exist.",
  storage_unknown: "Could not list the storage buckets. Check again in a minute.",
  buckets_missing: "These storage buckets are missing: {names}. Supabase Storage may still be starting: wait a minute and check again. If they stay missing, create them in Supabase > Storage.",

  secrets_ok: "The secret keys are set.",
  courier_key_missing: "COURIER_SECRET_KEY is not set. Everything works except saving payment and courier account keys. Add it when you need those.",
  courier_key_bad: "COURIER_SECRET_KEY must be exactly 32 random bytes in base64 (44 characters ending in =). Replace it with a fresh one.",
  app_secret_missing: "APP_SECRET is not set, so links are signed with the Supabase secret key instead. Fine to start; add a long random APP_SECRET later.",
  app_secret_short: "APP_SECRET is short. Use a random value of 32 characters or more.",

  setup_token_ok: "A setup code protects this installer.",
  setup_token_missing: "No setup code (SETUP_TOKEN). Until you finish, anyone who finds this address could set the site up before you. Finish now, or add SETUP_TOKEN first.",

  cron_ok: "The secret for scheduled jobs is set.",
  cron_secret_missing: "CRON_SECRET is not set, so scheduled jobs (nightly backup, reminders, scheduled posts) will not run. Add a long random CRON_SECRET.",

  email_ok: "Outgoing email is set up.",
  email_not_configured: "Not set up. The site works without it; form notifications and reminders by email stay off. You can add it in the next steps or later.",
  email_from_missing: "Outgoing email is set up, but EMAIL_FROM is not. Add the sender, for example: Your Business <hello@yourdomain.com>.",

  address_ok: "You are on the address the app was built for.",
  address_not_checked: "Checked in the browser, on the setup page.",
  address_mismatch: "You opened {actual}, but the app is set up for {expected}. Open {expected}, or change the site address in the settings.",
  address_www: "You opened {actual}; the app is set up for {expected}. Both can work, but pick one and redirect the other to it.",
  address_scheme: "You opened {actual}; the app is set up for {expected}. Use the https address so logins stay safe.",
};

/** Fill {name} parts. */
export function checkText(code, params = {}) {
  const text = CHECK_MESSAGES[code] ?? code;
  return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
}
