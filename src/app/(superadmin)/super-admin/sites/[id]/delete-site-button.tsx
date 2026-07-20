"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SiteDeleteModal } from "@/components/admin/site-delete-modal";
import { Button } from "@/components/ui/button";

export default function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="w-4 h-4" />
        Delete Site
      </Button>
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
