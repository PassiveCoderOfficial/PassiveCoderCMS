import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimited, clientIp } from "@/lib/rate-limit";
import { chatTenantFromRequest, siteChatFlags } from "@/lib/site-chat/config";
import { storeMediaFile } from "@/lib/media/upload";
import { isBlockedSender } from "@/lib/spam/guard";
import { CHAT_PHOTO_FOLDER, MAX_PHOTOS_PER_CHAT, MAX_PHOTOS_PER_SITE_DAY, MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/site-chat/intake-rules";
import type { ChatPhoto, MessageMeta } from "@/lib/site-chat/intake-copy";

export const maxDuration = 60;

/**
 * A visitor's job photo in the website chat, for sites with job intake on.
 * POST multipart { sessionId, file } -> the stored message.
 *
 * Public write path: the site comes from the host and the conversation from the
 * visitor's secret session id, never the body. Real JPEG/PNG/WebP only (checked
 * by decoding, not by the claimed type), re-encoded so location data and anything
 * hidden in the file are dropped, under an unguessable name, kept out of the
 * site's media library. Limits per IP, per chat and per site per day.
 */
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  const tenantId = await chatTenantFromRequest(req);
  if (!tenantId) return fail("Not available", 400);
  const ip = clientIp(req);
  if (rateLimited(`site-chat-photo:${ip}`, 12, 10 * 60_000)) return fail("Too many photos. Please wait a few minutes.", 429);
  const flags = await siteChatFlags(tenantId);
  if (!flags?.intake) return fail("Not available", 403);

  const form = await req.formData().catch(() => null);
  const sessionId = String(form?.get("sessionId") ?? "").slice(0, 64);
  const file = form?.get("file");
  if (!sessionId || !file || typeof file === "string") return fail("No photo", 400);
  if (!PHOTO_TYPES.test(file.type)) return fail("Please send a JPG, PNG or WebP photo.", 400);
  if (file.size > MAX_PHOTO_BYTES) return fail("That photo is too large.", 413);

  const admin = await createAdminClient();
  const { data: conv } = await admin.from("site_chat_conversations").select("id, blocked_at, unread_owner, lead_contact_id")
    .eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!conv) return fail("Start the chat first.", 404);

  // Banned: looks like it worked, nothing stored.
  if (conv.blocked_at || await isBlockedSender(tenantId, { ip, session: sessionId }, "chat_photo", {})) return NextResponse.json({ ok: true, message: null });

  const { data: earlier } = await admin.from("site_chat_messages").select("meta").eq("tenant_id", tenantId).eq("conversation_id", conv.id).eq("role", "visitor").limit(100);
  const inChat = (earlier ?? []).reduce((n, m) => n + ((m.meta as MessageMeta | null)?.photos?.length ?? 0), 0);
  if (inChat >= MAX_PHOTOS_PER_CHAT) return fail(`You can send up to ${MAX_PHOTOS_PER_CHAT} photos here.`, 400);
  const { count: today } = await admin.from("media").select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId).eq("folder", CHAT_PHOTO_FOLDER).gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((today ?? 0) >= MAX_PHOTOS_PER_SITE_DAY) return fail("Please send your photos on WhatsApp instead.", 429);

  let clean: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
    if (!["jpeg", "png", "webp"].includes(String(meta.format))) return fail("Please send a JPG, PNG or WebP photo.", 400);
    clean = await sharp(input, { limitInputPixels: 80_000_000 }).rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    return fail("Please send a JPG, PNG or WebP photo.", 400);
  }

  const stored = await storeMediaFile(admin, tenantId, new File([new Uint8Array(clean)], `chat-${randomUUID()}.webp`, { type: "image/webp" }), { folder: CHAT_PHOTO_FOLDER });
  if ("error" in stored) {
    console.error("[site-chat/photo]", tenantId, stored.error);
    return fail("Could not save that photo.", 500);
  }

  const photo: ChatPhoto = { url: stored.url, width: stored.width, height: stored.height };
  const { data: message } = await admin.from("site_chat_messages").insert({
    tenant_id: tenantId, conversation_id: conv.id, role: "visitor", body: `[Photo] ${stored.url}`, meta: { photos: [photo] } satisfies MessageMeta,
  }).select("id, role, body, author_name, created_at, meta").single();
  await admin.from("site_chat_conversations").update({
    last_at: new Date().toISOString(), last_message: "Photo", unread_owner: Number(conv.unread_owner) + 1, status: "open",
  }).eq("id", conv.id).eq("tenant_id", tenantId);
  // Sent after the lead was saved: it still reaches the lead's timeline.
  if (conv.lead_contact_id) {
    await admin.from("contact_events").insert({
      tenant_id: tenantId, contact_id: conv.lead_contact_id, type: "note", title: "Photo from the website chat", body: stored.url, meta: { source: "ai_chat", conversation_id: conv.id },
    });
  }
  return NextResponse.json({ ok: true, message });
}
