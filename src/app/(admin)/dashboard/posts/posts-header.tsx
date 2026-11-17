"use client";

// Same client/server split as pages/pages-header.tsx (page.tsx is a
// server component, useT() needs the client-side LanguageProvider).

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, FileText } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

export function PostsHeader({ count }: { count: number }) {
  const t = useT();
  return (
    <PageHeader
      className="mb-4"
      title={t("posts.title")}
      description={t("posts.count", { count })}
      actions={<Button asChild><Link href="/dashboard/posts/new"><Plus className="h-4 w-4 mr-2" /> {t("posts.newPost")}</Link></Button>}
    />
  );
}

export function PostsEmptyState({ inTrash }: { inTrash: boolean }) {
  const t = useT();
  return (
    <EmptyState
      className="m-4"
      icon={FileText}
      title={inTrash ? t("posts.trashEmpty") : t("posts.noPostsYet")}
      description={inTrash ? undefined : t("posts.createFirstPost")}
      action={inTrash ? undefined : <Button asChild><Link href="/dashboard/posts/new">{t("posts.newPost")}</Link></Button>}
    />
  );
}
