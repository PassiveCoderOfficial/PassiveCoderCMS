import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Globe, Plus, Pencil, Eye, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Root Pages — Super Admin" };

export default async function RootPagesPage() {
  const supabase = await createAdminClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id,title,slug,status,updated_at")
    .is("tenant_id", null)
    .order("updated_at", { ascending: false });

  const STATUS_COLOR: Record<string, string> = {
    published: "bg-green-900/50 text-green-400",
    draft: "bg-gray-800 text-gray-400",
    scheduled: "bg-amber-900/50 text-amber-400",
    archived: "bg-gray-800 text-gray-500",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" /> Root Site Pages
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pages served on <span className="text-indigo-400 font-mono">passivecoder.com</span>. Slug <span className="font-mono text-amber-400">home</span> replaces the static homepage.
          </p>
        </div>
        <Link
          href="/super-admin/root-pages/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium hidden lg:table-cell">Updated</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(pages ?? []).map(page => (
                <tr key={page.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{page.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden sm:table-cell">/{page.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[page.status] ?? "bg-gray-800 text-gray-400"}`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/super-admin/root-pages/${page.id}`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <a
                        href={`/${page.slug === "home" ? "" : page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {!pages?.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-600">
                    No root pages yet. Create a page with slug <span className="font-mono text-amber-400">home</span> to replace the static homepage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 text-sm text-indigo-300 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> How it works</p>
        <ul className="text-xs text-indigo-400 space-y-1 mt-2">
          <li>• Slug <span className="font-mono">home</span> → replaces static homepage at passivecoder.com</li>
          <li>• Slug <span className="font-mono">about</span> → served at passivecoder.com/about</li>
          <li>• Status must be <span className="font-mono">published</span> to go live</li>
          <li>• Static homepage is shown as fallback when no published home page exists</li>
        </ul>
      </div>
    </div>
  );
}
