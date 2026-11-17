-- How the site chat invites visitors (2026-11-16). Null = the default:
-- a small callout next to the chat button after a few seconds, instead of
-- opening the chat window by itself.
--   {"mode": "bubble" | "open" | "off", "text": "<owner's own callout text>" | null}
alter table public.tenants add column if not exists site_chat_prompt jsonb;
