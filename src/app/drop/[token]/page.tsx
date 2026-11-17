import { createAdminClient } from "@/lib/supabase/server";
import { resolveUploadLink } from "@/lib/media/upload-links";
import { DropZone } from "./drop-zone";

export const metadata = { title: "Upload images", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DropPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveUploadLink(await createAdminClient(), token);
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 space-y-4">
        {link ? (
          <>
            <div>
              <h1 className="text-xl font-bold">Upload images to {link.siteName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Files go straight into the site&apos;s media library. When you are done, go back to Claude and say &quot;uploaded&quot;.
              </p>
            </div>
            <DropZone token={token} />
            <p className="text-xs text-muted-foreground">Link valid until {new Date(link.expires_at).toUTCString()}.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Link expired</h1>
            <p className="text-sm text-muted-foreground">This upload link is no longer valid. Ask Claude for a new one.</p>
          </>
        )}
      </div>
    </main>
  );
}
