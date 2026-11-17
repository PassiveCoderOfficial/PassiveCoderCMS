"use client";

import { groupedApi } from "@/lib/content/grouped-api-client";
import React, { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, Loader2, Wrench, Copy } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SortableList } from "@/components/admin/sortable-list";
import { emitContentChanged } from "@/lib/content/content-events";
import { IconPicker } from "@/components/ui/icon-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { useT } from "@/lib/i18n/language-provider";

type IconType = "lucide" | "image" | "emoji";

interface ServiceItem {
  id: string;
  group_id: string;
  title: string;
  description: string;
  icon_type: IconType;
  icon: string | null;
  image_url: string | null;
  link: string | null;
  link_label: string | null;
  sort_order: number;
}

interface ServiceGroup {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  service_items: ServiceItem[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const api = groupedApi("/api/services");

/** Save a new order; only rows whose position changed are written. */
async function saveOrder(type: "item" | "group", rows: { id: string; sort_order: number }[]) {
  await Promise.all(rows.flatMap((r, i) => (r.sort_order === i ? [] : [api("PATCH", { _type: type, id: r.id, sort_order: i })])));
}

function ItemEditor({ item: initial, groupId, nextOrder, onSave, onCancel }: {
  item: Partial<ServiceItem>; groupId: string; nextOrder: number;
  onSave: (item: ServiceItem, isNew: boolean) => void; onCancel: () => void;
}) {
  const t = useT();
  const [item, setItem] = useState<Partial<ServiceItem>>({ icon_type: "lucide", ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ServiceItem, v: string) => setItem(p => ({ ...p, [k]: v }));
  const isNew = !item.id;

  async function save() {
    if (!item.title?.trim()) return;
    setSaving(true);
    let data;
    try {
      const res = await api(isNew ? "POST" : "PATCH", {
        _type: "item", ...(isNew ? { group_id: groupId, sort_order: nextOrder } : {}), ...item,
      });
      data = isNew ? await res.json() : { ...item, id: item.id! };
    } finally {
      setSaving(false);
    }
    onSave(data as ServiceItem, isNew);
  }

  return (
    <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.itemTitle")}</label>
          <input value={item.title ?? ""} onChange={e => set("title", e.target.value)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.iconType")}</label>
          <select value={item.icon_type ?? "lucide"} onChange={e => set("icon_type", e.target.value as IconType)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="lucide">{t("servicesPage.lucideIcon")}</option>
            <option value="emoji">{t("servicesPage.emoji")}</option>
            <option value="image">{t("servicesPage.imageUrl")}</option>
          </select>
        </div>
      </div>
      {item.icon_type === "lucide" ? (
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.icon")}</label>
          <IconPicker value={item.icon ?? ""} onChange={v => set("icon", v)} />
        </div>
      ) : item.icon_type === "emoji" ? (
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.emoji")}</label>
          <input value={item.icon ?? ""} onChange={e => set("icon", e.target.value)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" placeholder="🔧" />
        </div>
      ) : (
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.image")}</label>
          <MediaPickerInput compact value={item.image_url ?? ""} onChange={v => set("image_url", v)} />
        </div>
      )}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.description")}</label>
        <textarea rows={2} value={item.description ?? ""} onChange={e => set("description", e.target.value)}
          className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.linkUrl")}</label>
          <input value={item.link ?? ""} onChange={e => set("link", e.target.value)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("servicesPage.linkLabel")}</label>
          <input value={item.link_label ?? ""} onChange={e => set("link_label", e.target.value)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !item.title?.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} {t("servicesPage.save")}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-muted-foreground/20 hover:bg-gray-600 text-foreground text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> {t("servicesPage.cancel")}
        </button>
      </div>
    </div>
  );
}

function GroupCard({ group, handle, onUpdate, onDelete, onSaved }: {
  group: ServiceGroup; handle: React.ReactNode; onUpdate: (g: ServiceGroup, pending?: boolean) => void; onDelete: (id: string) => void; onSaved: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  async function saveName() {
    await api("PATCH", { _type: "group", id: group.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...group, name, slug: slugify(name) });
  }

  async function deleteGroup() {
    if (!confirm(t("servicesPage.deleteGroupConfirm", { name: group.name }))) return;
    await api("DELETE", undefined, { type: "group", id: group.id });
    onDelete(group.id);
  }

  async function deleteItem(id: string) {
    await api("DELETE", undefined, { type: "item", id });
    onUpdate({ ...group, service_items: group.service_items.filter(i => i.id !== id) });
  }

  async function duplicateItem(item: ServiceItem) {
    const res = await api("POST", {
      _type: "item", group_id: group.id,
      title: item.title + t("servicesPage.copySuffix"), description: item.description,
      icon_type: item.icon_type, icon: item.icon, image_url: item.image_url,
      link: item.link, link_label: item.link_label, sort_order: group.service_items.length,
    });
    const data = await res.json();
    onUpdate({ ...group, service_items: [...group.service_items, data as ServiceItem] });
  }

  async function reorderItems(next: ServiceItem[]) {
    onUpdate({ ...group, service_items: next.map((it, i) => ({ ...it, sort_order: i })) }, true);
    try { await saveOrder("item", next); onSaved(); }
    catch { onUpdate(group, true); }
  }

  function handleItemSaved(item: ServiceItem, isNew: boolean) {
    if (isNew) { onUpdate({ ...group, service_items: [...group.service_items, item] }); setAddingItem(false); }
    else { onUpdate({ ...group, service_items: group.service_items.map(i => i.id === item.id ? item : i) }); setEditingItem(null); }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {handle}
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
            <span className="text-xs text-muted-foreground">/{group.slug}</span>
            <button onClick={() => setEditingName(true)} className="ml-1 text-muted-foreground hover:text-foreground/80"><Pencil className="w-3 h-3" /></button>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{t("servicesPage.itemsCount", { count: group.service_items.length, plural: group.service_items.length !== 1 ? "s" : "" })}</span>
        <button onClick={deleteGroup} className="text-muted-foreground hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && (
        <div className="p-4 space-y-3 border-t border-border">
          <SortableList items={group.service_items} onReorder={reorderItems} className="space-y-3" handleLabel={t("servicesPage.dragToReorder")}
            renderItem={(item, itemHandle) => (
              editingItem === item.id ? (
                <ItemEditor item={item} groupId={group.id} nextOrder={item.sort_order}
                  onSave={handleItemSaved} onCancel={() => setEditingItem(null)} />
              ) : (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg group/item">
                  <div className="mt-1.5">{itemHandle}</div>
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-muted-foreground/20 flex-shrink-0">
                    {item.icon_type === "emoji" ? <span className="text-lg">{item.icon}</span>
                      : item.icon_type === "image" ? <img src={item.image_url ?? ""} className="w-6 h-6 object-contain" alt="" />
                      : <Wrench className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={() => setEditingItem(item.id)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => duplicateItem(item)} className="text-muted-foreground hover:text-green-400 p-1" title={t("servicesPage.duplicate")}><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )
            )} />
          {addingItem ? (
            <ItemEditor item={{ icon_type: "lucide" }} groupId={group.id} nextOrder={group.service_items.length}
              onSave={handleItemSaved} onCancel={() => setAddingItem(false)} />
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="w-full flex items-center gap-2 border border-dashed border-border hover:border-primary rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Plus className="w-4 h-4" /> {t("servicesPage.addServiceItem")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Groups and their items. The Services page uses it, and so does the popup in the block editor. */
export default function ServicesManager({ initialGroups, embedded = false, onGroupCreated }: {
  initialGroups: ServiceGroup[]; embedded?: boolean; onGroupCreated?: (id: string) => void;
}) {
  const t = useT();
  const [groups, setGroups] = useState<ServiceGroup[]>(initialGroups);
  const saved = () => emitContentChanged("services");

  async function reorderGroups(next: ServiceGroup[]) {
    const before = groups;
    setGroups(next.map((g, i) => ({ ...g, sort_order: i })));
    try { await saveOrder("group", next); saved(); }
    catch { setGroups(before); }
  }
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
    setGroups(prev => [...prev, { ...data, service_items: [] }]);
    setNewName(""); setCreating(false);
    saved();
    onGroupCreated?.(data.id);
  }

  return (
    <div className={embedded ? "space-y-4" : "p-6 max-w-4xl space-y-6"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          {embedded ? (
            <p className="text-xs text-muted-foreground">{t("servicesPage.liveHint")}</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary" /> {t("servicesPage.title")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("servicesPage.subtitle")}</p>
            </>
          )}
        </div>
        <button onClick={() => setCreating(true)} data-guide="services-new-group" className="flex shrink-0 items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> {t("servicesPage.newGroup")}
        </button>
      </div>
      {creating && (
        <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setCreating(false); }}
            placeholder={t("servicesPage.groupNamePlaceholder")}
            className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          <button onClick={createGroup} disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t("servicesPage.create")}
          </button>
          <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
      )}
      {groups.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Wrench className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t("servicesPage.noGroupsYet")}</p>
        </div>
      ) : (
        <SortableList items={groups} onReorder={reorderGroups} className="space-y-4" handleLabel={t("servicesPage.dragToReorder")}
          renderItem={(group, handle) => (
            <GroupCard group={group} handle={handle} onSaved={saved}
              onUpdate={(u, pending) => { setGroups(prev => prev.map(g => g.id === u.id ? u : g)); if (!pending) saved(); }}
              onDelete={id => { setGroups(prev => prev.filter(g => g.id !== id)); saved(); }} />
          )} />
      )}
    </div>
  );
}

/**
 * The manager in a popup docked over the editor's left side, with no backdrop:
 * the canvas stays visible and updates as things are saved.
 */
export function ServicesManagerDialog({ open, onOpenChange, onGroupCreated }: {
  open: boolean; onOpenChange: (open: boolean) => void; onGroupCreated?: (id: string) => void;
}) {
  const t = useT();
  const [groups, setGroups] = useState<ServiceGroup[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setGroups(null);
    let cancelled = false;
    fetch("/api/services").then(r => r.json())
      .then(data => { if (!cancelled) setGroups(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setGroups([]); });
    return () => { cancelled = true; };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          onInteractOutside={e => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed bottom-3 left-3 top-3 z-50 flex w-[min(26rem,calc(100vw-1.5rem))] flex-col rounded-xl border bg-background text-foreground shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <DialogPrimitive.Title className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-primary" /> {t("servicesPage.manageGroups")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label={t("servicesPage.cancel")} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {groups === null
              ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : <ServicesManager embedded initialGroups={groups} onGroupCreated={onGroupCreated} />}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
