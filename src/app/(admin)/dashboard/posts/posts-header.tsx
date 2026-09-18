"use client";

// Same client/server split as pages/pages-header.tsx (page.tsx is a
// server component, useT() needs the client-side LanguageProvider).

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

export function PostsHeader({ count }: { count: number }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold">{t("posts.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("posts.count", { count })}</p>
      </div>
      <Button asChild size="sm">
        <Link href="/dashboard/posts/new"><Plus className="h-4 w-4 mr-2" /> {t("posts.newPost")}</Link>
      </Button>
    </div>
  );
}

export function PostsEmptyState({ inTrash }: { inTrash: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium">{inTrash ? t("posts.trashEmpty") : t("posts.noPostsYet")}</p>
      {!inTrash && (
        <>
          <p className="text-sm text-muted-foreground mb-4">{t("posts.createFirstPost")}</p>
          <Button asChild size="sm"><Link href="/dashboard/posts/new">{t("posts.newPost")}</Link></Button>
        </>
      )}
    </div>
  );
}
