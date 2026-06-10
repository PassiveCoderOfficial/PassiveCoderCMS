"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { revalidatePath } from "next/cache";

const BUCKET = "media";

export async function uploadMediaFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const supabase = await createAdminClient();

  // Unique filename: timestamp + original name (sanitised)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `uploads/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const tenantId = await getCurrentTenantId();
  const { error: dbError } = await supabase.from("media").insert({
    name: safeName,
    original_name: file.name,
    url,
    mime_type: file.type,
    size: file.size,
    storage_path: path,
    tenant_id: tenantId,
  });

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/media");
  return { url };
}

export async function deleteMediaFile(id: string, storagePath: string) {
  const supabase = await createAdminClient();
  const tenantId = await getCurrentTenantId();

  // Verify the media row belongs to the current tenant before touching storage
  // (admin client bypasses RLS, so scope explicitly).
  const { data: row } = await supabase.from("media").select("id").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return { error: "Not found" };

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageError) return { error: storageError.message };

  const { error: dbError } = await supabase.from("media").delete().eq("id", id).eq("tenant_id", tenantId);
  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/media");
  return { success: true };
}

export async function updateMediaAlt(id: string, alt: string) {
  const supabase = await createAdminClient();
  const tenantId = await getCurrentTenantId();
  const { error } = await supabase.from("media").update({ alt }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/media");
  return { success: true };
}
