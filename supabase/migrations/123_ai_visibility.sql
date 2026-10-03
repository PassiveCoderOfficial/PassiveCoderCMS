-- AI visibility settings (Dashboard > SEO).
-- allow_ai_training: when false, robots.txt blocks AI *training* crawlers
-- (GPTBot, ClaudeBot, Google-Extended, CCBot...). AI *search* crawlers that
-- cite the site in answers stay allowed either way.
alter table public.site_settings add column if not exists allow_ai_training boolean not null default true;
-- Bing Webmaster Tools verification code (ChatGPT search and Copilot use Bing's index).
alter table public.site_settings add column if not exists bing_site_verification text;
