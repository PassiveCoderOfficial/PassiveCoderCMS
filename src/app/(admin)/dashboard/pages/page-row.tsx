"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { PageActions } from "./page-actions";

interface PageRowProps {
  page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
  };
}

export function PageRow({ page }: PageRowProps) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/pages/${page.id}`)}
    >
      <td className="px-4 py-3">
        <span className="font-medium text-sm">{page.title}</span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{page.slug}</code>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <StatusBadge status={page.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
        {formatDateTime(page.updated_at)}
      </td>
      <td className="px-4 py-3 text-right">
        <PageActions pageId={page.id} pageSlug={page.slug} />
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "success" | "warning" | "outline"> = {
    published: "success", draft: "outline", scheduled: "warning", archived: "secondary" as never,
  };
  return <Badge variant={variants[status] ?? "outline"} className="capitalize text-xs">{status}</Badge>;
}
