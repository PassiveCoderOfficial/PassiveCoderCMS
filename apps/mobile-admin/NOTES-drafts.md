# Mobile admin: switch page saves to draft/publish (TODO)

Left 2026-09-27 by the web production-audit session.

The web page editor now uses draft/publish for live pages (migration 105,
v1.0.334). This app still writes `pages.blocks` directly in
`lib/queries/pages.ts` → `updatePageBlocks`, which:

- publishes every save to the live site instantly, and
- wipes any unpublished draft a user left in the web editor for that page.

Fix: use the `save_page_blocks` / `publish_page` / `discard_page_draft` RPCs,
load `draft_blocks ?? blocks`, track `draft_rev`, handle the `page_conflict`
error, and add a Publish button plus a "not live yet" state. Details are in
the comment on `updatePageBlocks`.
