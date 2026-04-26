"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

export default function AnnouncementBar({ text, url }: { text: string; url: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const content = (
    <span className="text-sm font-medium">{text}</span>
  );
  return (
    <div className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 relative">
      {url ? <Link href={url} className="hover:underline">{content}</Link> : content}
      <button onClick={() => setDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
