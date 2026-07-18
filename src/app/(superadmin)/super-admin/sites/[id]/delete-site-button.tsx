"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SiteDeleteModal } from "@/components/admin/site-delete-modal";

export default function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete Site
      </button>
      {open && (
        <SiteDeleteModal
          site={{ id: siteId, name: siteName }}
          onClose={() => setOpen(false)}
          onDeleted={() => router.push("/super-admin/sites")}
        />
      )}
    </>
  );
}
