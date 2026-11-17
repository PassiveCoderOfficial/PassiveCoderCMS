"use client";

import { groupedApi } from "@/lib/content/grouped-api-client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, Loader2, FolderOpen, Copy, Upload } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { useT } from "@/lib/i18n/language-provider";
import { uploadMediaFile } from "@/app/(admin)/dashboard/media/actions";
import { compressImageForUpload } from "@/lib/media/client-compress";
import { joinPortfolioTags, portfolioTitle, splitPortfolioTags, type PortfolioFields } from "@/lib/portfolio/fields";
import { DateTimeField } from "@/components/ui/date-time-field";

interface PortfolioItem {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  image_url: string;
  link: string | null;
  tags: string[];
  sort_order: number;
}

interface PortfolioGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  portfolio_items: PortfolioItem[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const api = groupedApi("/api/portfolio");

const inputCls = "w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none";

/** Country / type / date: optional, stored as prefixed tags (see lib/portfolio/fields). */
function FieldInputs({ fields, onChange }: { fields: PortfolioFields; onChange: (f: PortfolioFields) => void }) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.country")}</label>
        <input value={fields.country ?? ""} onChange={e => onChange({ ...fields, country: e.target.value })}
          placeholder={t("portfolio.countryPlaceholder")} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.kind")}</label>
        <input value={fields.kind ?? ""} onChange={e => onChange({ ...fields, kind: e.target.value })}
          placeholder={t("portfolio.kindPlaceholder")} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.date")}</label>
        <DateTimeField type="date" value={fields.date ?? ""} onChange={e => onChange({ ...fields, date: e.target.value })} className={inputCls} />
      </div>
    </div>
  );
}

function ItemEditor({ item: initial, groupId, onSave, onCancel }: {
  item: Partial<PortfolioItem>; groupId: string;
  onSave: (item: PortfolioItem, isNew: boolean) => void; onCancel: () => void;
}) {
  const t = useT();
  const split = splitPortfolioTags(initial.tags);
  const [item, setItem] = useState<Partial<PortfolioItem>>({ tags: [], ...initial });
  const [fields, setFields] = useState<PortfolioFields>(split.fields);
  const [tagInput, setTagInput] = useState(split.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const isNew = !item.id;
  const set = (k: keyof PortfolioItem, v: unknown) => setItem(p => ({ ...p, [k]: v }));

  async function save() {
    if (!item.image_url?.trim()) return;
    setSaving(true);
    let data;
    try {
      const tags = joinPortfolioTags(fields, tagInput.split(","));
      const title = item.title?.trim() || portfolioTitle(fields, item.image_url.split("/").pop());
      const payload = { ...item, title, tags, ...(isNew ? { group_id: groupId } : {}) };
      const res = await api(isNew ? "POST" : "PATCH", { _type: "item", ...payload });
      data = isNew ? await res.json() : { ...payload, id: item.id! };
    } finally {
      setSaving(false);
    }
    onSave(data as PortfolioItem, isNew);
  }

  return (
    <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.itemTitleOptional")}</label>
          <input value={item.title ?? ""} onChange={e => set("title", e.target.value)} placeholder={t("portfolio.titleAutoHint")} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.image")}</label>
          <MediaPickerInput compact value={item.image_url ?? ""} onChange={v => set("image_url", v)} />
        </div>
      </div>
      <FieldInputs fields={fields} onChange={setFields} />
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.description")}</label>
        <textarea rows={2} value={item.description ?? ""} onChange={e => set("description", e.target.value)}
          className={inputCls + " resize-none"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.linkUrl")}</label>
          <input value={item.link ?? ""} onChange={e => set("link", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("portfolio.tagsCommaSeparated")}</label>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} className={inputCls} placeholder={t("portfolio.tagsPlaceholder")} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !item.image_url?.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} {t("portfolio.save")}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-muted-foreground/20 text-foreground text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> {t("portfolio.cancel")}
        </button>
      </div>
    </div>
  );
}

const MAX_FILE = 25 * 1024 * 1024;
const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

/**
 * Many images at once: each file is uploaded to the media library and becomes
 * its own portfolio item, with the shared country / type / date. Files picked
 * twice (same name, size and date) are uploaded once; files already uploaded
 * from this panel are skipped if picked again.
 */
function BulkUpload({ group, onAdded, onClose }: {
  group: PortfolioGroup; onAdded: (items: PortfolioItem[]) => void; onClose: () => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const done = useRef(new Set<string>());
  const [files, setFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<PortfolioFields>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    let dupes = 0;
    setFiles(prev => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of Array.from(list)) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > MAX_FILE) { toast.error(`${f.name}: larger than 25 MB`); continue; }
        const k = fileKey(f);
        if (seen.has(k) || done.current.has(k)) { dupes++; continue; }
        seen.add(k); next.push(f);
      }
      return next;
    });
    if (dupes) toast.info(t("portfolio.duplicatesSkipped", { count: dupes }));
  }

  async function run() {
    if (!files.length) return;
    const total = files.length;
    const tags = joinPortfolioTags(fields, []);
    const added: PortfolioItem[] = [];
    let failed = 0, finished = 0, next = 0;
    setProgress({ done: 0, total });
    // Three at a time: quick for a stack of scans, gentle on the server.
    async function worker() {
      while (next < total) {
        const i = next++;
        const file = files[i];
        try {
          const fd = new FormData();
          fd.append("file", await compressImageForUpload(file));
          const up = await uploadMediaFile(fd);
          if (!("url" in up) || !up.url) throw new Error("error" in up ? String(up.error) : "Upload failed");
          const res = await api("POST", {
            _type: "item", group_id: group.id,
            title: portfolioTitle(fields, file.name), image_url: up.url, tags,
            sort_order: group.portfolio_items.length + i,
          });
          added[i] = await res.json() as PortfolioItem;
          done.current.add(fileKey(file));
        } catch (e) {
          failed++;
          console.error("portfolio bulk upload", file.name, e);
        }
        finished++;
        setProgress({ done: finished, total });
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    const ok = added.filter(Boolean);
    if (ok.length) { onAdded(ok); toast.success(t("portfolio.uploadDone", { count: ok.length })); }
    if (failed) toast.error(t("portfolio.uploadFailed", { count: failed }));
    setProgress(null);
    setFiles(prev => prev.filter(f => !done.current.has(fileKey(f))));
    if (!failed) onClose();
  }

  const busy = !!progress;
  return (
    <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{t("portfolio.bulkTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("portfolio.bulkHint")}</p>
        </div>
        <button onClick={onClose} disabled={busy} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) addFiles(e.dataTransfer.files); }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"}`}
      >
        <Upload className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("portfolio.chooseFiles")}</span>
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("portfolio.filesSelected", { count: files.length })}</span>
            {!busy && <button onClick={() => setFiles([])} className="hover:text-foreground underline">{t("portfolio.clearFiles")}</button>}
          </div>
          <ul className="max-h-32 overflow-y-auto text-xs text-foreground/80 space-y-0.5">
            {files.map(f => (
              <li key={fileKey(f)} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                {!busy && <button onClick={() => setFiles(prev => prev.filter(x => x !== f))} className="text-muted-foreground hover:text-red-400"><X className="w-3 h-3" /></button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <FieldInputs fields={fields} onChange={setFields} />
      <button onClick={run} disabled={busy || !files.length}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {busy ? t("portfolio.uploadingProgress", { done: progress.done, total: progress.total }) : t("portfolio.uploadN", { count: files.length })}
      </button>
    </div>
  );
}

function GroupCard({ group, onUpdate, onDelete }: {
  group: PortfolioGroup; onUpdate: (g: PortfolioGroup) => void; onDelete: (id: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [addingItem, setAddingItem] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  async function saveName() {
    await api("PATCH", { _type: "group", id: group.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...group, name, slug: slugify(name) });
  }

  async function deleteGroup() {
    if (!confirm(t("portfolio.deleteGalleryConfirm", { name: group.name }))) return;
    await api("DELETE", undefined, { type: "group", id: group.id });
    onDelete(group.id);
  }

  async function deleteItem(id: string) {
    await api("DELETE", undefined, { type: "item", id });
    onUpdate({ ...group, portfolio_items: group.portfolio_items.filter(i => i.id !== id) });
  }

  async function duplicateItem(item: PortfolioItem) {
    const res = await api("POST", {
      _type: "item", group_id: group.id,
      title: item.title + t("portfolio.copySuffix"), description: item.description,
      image_url: item.image_url, link: item.link, tags: item.tags,
      sort_order: group.portfolio_items.length,
    });
    const data = await res.json();
    onUpdate({ ...group, portfolio_items: [...group.portfolio_items, data as PortfolioItem] });
  }

  function handleItemSaved(item: PortfolioItem, isNew: boolean) {
    if (isNew) { onUpdate({ ...group, portfolio_items: [...group.portfolio_items, item] }); setAddingItem(false); }
    else { onUpdate({ ...group, portfolio_items: group.portfolio_items.map(i => i.id === item.id ? item : i) }); setEditingItem(null); }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="flex-1 bg-muted border border-primary rounded px-2 py-1 text-sm text-foreground focus:outline-none" />
            <button onClick={saveName} className="text-primary"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditingName(false); setName(group.name); }} className="text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-foreground text-sm">{group.name}</span>
            <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground/80"><Pencil className="w-3 h-3" /></button>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{t("portfolio.itemsCount", { count: group.portfolio_items.length })}</span>
        <button onClick={deleteGroup} className="text-muted-foreground hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {group.portfolio_items.map(item => (
              editingItem === item.id ? (
                <div key={item.id} className="col-span-full">
                  <ItemEditor item={item} groupId={group.id}
                    onSave={(u, isNew) => handleItemSaved(u, isNew)} onCancel={() => setEditingItem(null)} />
                </div>
              ) : (
                <div key={item.id} className="relative group/item rounded-lg overflow-hidden aspect-square bg-muted">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditingItem(item.id)} className="bg-white/20 hover:bg-white/30 p-1 rounded"><Pencil className="w-3 h-3 text-foreground" /></button>
                      <button onClick={() => duplicateItem(item)} className="bg-white/20 hover:bg-green-500/80 p-1 rounded" title={t("portfolio.duplicate")}><Copy className="w-3 h-3 text-foreground" /></button>
                      <button onClick={() => deleteItem(item.id)} className="bg-red-500/80 hover:bg-red-500 p-1 rounded"><Trash2 className="w-3 h-3 text-foreground" /></button>
                    </div>
                    <div>
                      <p className="text-foreground text-xs font-medium truncate">{item.title}</p>
                      {(() => {
                        const { fields, tags } = splitPortfolioTags(item.tags);
                        const chips = [fields.country, fields.kind, fields.date, ...tags].filter(Boolean) as string[];
                        return chips.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {chips.slice(0, 4).map(tag => <span key={tag} className="text-xs bg-white/20 text-foreground px-1 rounded">{tag}</span>)}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>

          {addingItem ? (
            <ItemEditor item={{}} groupId={group.id}
              onSave={(item, isNew) => handleItemSaved(item, isNew)} onCancel={() => setAddingItem(false)} />
          ) : bulk ? (
            <BulkUpload group={group} onClose={() => setBulk(false)}
              onAdded={items => onUpdate({ ...group, portfolio_items: [...group.portfolio_items, ...items] })} />
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setAddingItem(true)}
                className="flex-1 flex items-center gap-2 border border-dashed border-border hover:border-primary rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Plus className="w-4 h-4" /> {t("portfolio.addPortfolioItem")}
              </button>
              <button onClick={() => setBulk(true)}
                className="flex-1 flex items-center gap-2 border border-dashed border-border hover:border-primary rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Upload className="w-4 h-4" /> {t("portfolio.uploadMany")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortfolioClient({ initialGroups }: { initialGroups: PortfolioGroup[] }) {
  const t = useT();
  const [groups, setGroups] = useState(initialGroups);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGroup() {
    if (!newName.trim()) return;
    setSaving(true);
    let data;
    try {
      const res = await api("POST", { _type: "group", name: newName.trim(), slug: slugify(newName.trim()), sort_order: groups.length });
      data = await res.json();
    } finally {
      setSaving(false);
    }
    setGroups(prev => [...prev, { ...data, portfolio_items: [] }]);
    setNewName(""); setCreating(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" /> {t("portfolio.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("portfolio.subtitle")}</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> {t("portfolio.newGallery")}
        </button>
      </div>

      {creating && (
        <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setCreating(false); }}
            placeholder={t("portfolio.galleryNamePlaceholder")}
            className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          <button onClick={createGroup} disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t("portfolio.create")}
          </button>
          <button onClick={() => setCreating(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
      )}

      {groups.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <FolderOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t("portfolio.noGalleriesYet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <GroupCard key={g.id} group={g}
              onUpdate={u => setGroups(prev => prev.map(x => x.id === u.id ? u : x))}
              onDelete={id => setGroups(prev => prev.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
