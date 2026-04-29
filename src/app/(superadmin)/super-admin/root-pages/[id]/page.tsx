import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { BuilderInterface } from "@/components/admin/page-builder/builder-interface";
import { RootPageEditorHeader } from "./root-page-editor-header";
import type { Page } from "@/types/cms";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RootPageEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .is("tenant_id", null)
    .single();

  if (!page) notFound();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <RootPageEditorHeader page={page as Page} />
      <div className="flex-1 overflow-hidden">
        <BuilderInterface page={page as Page} />
      </div>
    </div>
  );
}
