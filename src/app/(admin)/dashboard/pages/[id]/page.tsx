import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuilderInterface } from "@/components/admin/page-builder/builder-interface";
import { PageEditorHeader } from "./page-editor-header";
import type { Page } from "@/types/cms";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PageEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (!page) notFound();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageEditorHeader page={page as Page} />
      <div className="flex-1 overflow-hidden">
        <BuilderInterface page={page as Page} />
      </div>
    </div>
  );
}
