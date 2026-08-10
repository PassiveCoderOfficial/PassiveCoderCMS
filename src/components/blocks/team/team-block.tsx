import React from "react";
import type { TeamBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Mail, Globe } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail, website: Globe,
};

// ─── Shared avatar-fallback helper ──────────────────────────────────────────
// Initials-in-colored-circle when no avatar image is present, matching the
// convention used in testimonials-block.tsx (bg-primary/10 + text-primary).
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// ─── Variant: avatar-cards-pro ──────────────────────────────────────────────
// Clean grid of cards: circular avatar (or initials fallback), name, role in
// accent color, optional bio, subtle border/shadow, hover lift. "Meet the
// team" look.
function TeamAvatarCardsPro({ data }: { data: TeamBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-lg text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colClass)}>
        {data.members.map((m) => (
          <div
            key={m.id}
            className="flex flex-col items-center text-center bg-background border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 shrink-0 mb-4">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                  {initialsOf(m.name)}
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg">{m.name}</h3>
            {m.role && <p className="text-sm text-primary font-medium">{m.role}</p>}
            {data.showBio && m.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.bio}</p>}
            {data.showSocial && m.social && m.social.length > 0 && (
              <div className="flex gap-2 mt-3 justify-center">
                {m.social.map((s, i) => {
                  const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
                  return (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: minimal-list ───────────────────────────────────────────────────
// Compact horizontal-row list: small circular avatar/initials + name + role
// inline per row, thin divider between rows, no cards/boxes — good for a
// dense leadership list of 5+ people.
function TeamMinimalList({ data }: { data: TeamBlockProps["data"] }) {
  return (
    <div className="max-w-3xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-8">
          {data.title && <h2 className="text-2xl font-bold mb-2">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className="divide-y divide-border border-t border-b">
        {data.members.map((m) => (
          <div key={m.id} className="flex items-center gap-4 py-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 shrink-0">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">
                  {initialsOf(m.name)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{m.name}</span>
              {m.role && <span className="text-sm text-primary font-medium truncate">{m.role}</span>}
            </div>
            {data.showSocial && m.social && m.social.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {m.social.map((s, i) => {
                  const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
                  return (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Avatar image with an initials fallback, shared by the newer variants. */
function Avatar({ member, className, rounded = "full" }: {
  member: TeamBlockProps["data"]["members"][number];
  className?: string;
  rounded?: "full" | "xl" | "none";
}) {
  const roundedCls = { full: "rounded-full", xl: "rounded-2xl", none: "" }[rounded];
  if (member.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.avatar} alt={member.name} className={cn("object-cover", roundedCls, className)} loading="lazy" />;
  }
  return (
    <div className={cn("flex items-center justify-center bg-primary/10 text-primary font-semibold", roundedCls, className)}>
      {initialsOf(member.name)}
    </div>
  );
}

function TeamHead({ title, subtitle, align = "center" }: { title?: string; subtitle?: string; align?: "center" | "left" }) {
  if (!title && !subtitle) return null;
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left")}>
      {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ─── Variant: photo-tiles ─────────────────────────────────────────────────────
// Full-bleed square photos with the name overlaid on a gradient scrim. Strong
// and visual — suits studios, agencies and salons where the people are the sell.
function TeamPhotoTiles({ data }: { data: TeamBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className={cn("grid grid-cols-1 gap-3", colClass)}>
        {data.members.map((m) => (
          <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl">
            <Avatar member={m} rounded="none" className="w-full h-full text-3xl transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              <p className="font-semibold text-white leading-tight">{m.name}</p>
              {m.role && <p className="text-xs text-white/75 mt-0.5">{m.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: bio-rows ────────────────────────────────────────────────────────
// Alternating wide rows with a large portrait and room for a real bio. Best
// for small teams where each person's story matters.
function TeamBioRows({ data }: { data: TeamBlockProps["data"] }) {
  return (
    <div className="max-w-5xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className="space-y-10">
        {data.members.map((m, i) => (
          <div key={m.id} className={cn("flex flex-col gap-6 sm:flex-row sm:items-center", i % 2 === 1 && "sm:flex-row-reverse")}>
            <Avatar member={m} rounded="xl" className="w-full sm:w-56 h-56 shrink-0 text-4xl" />
            <div className="flex-1">
              <h3 className="text-xl font-bold">{m.name}</h3>
              {m.role && <p className="text-primary font-medium text-sm mt-0.5">{m.role}</p>}
              {data.showBio && m.bio && <p className="text-muted-foreground leading-relaxed mt-3">{m.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: compact-grid ────────────────────────────────────────────────────
// Small avatars in a dense grid — designed for large teams where a full card
// per person would run for pages.
function TeamCompactGrid({ data }: { data: TeamBlockProps["data"] }) {
  return (
    <div className="max-w-6xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {data.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar member={m} className="w-11 h-11 shrink-0 text-xs" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{m.name}</p>
              {m.role && <p className="text-xs text-muted-foreground truncate">{m.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-cards ──────────────────────────────────────────────────────
// Card grid tuned for dark palettes — lifted surfaces with an accent rule.
function TeamDarkCards({ data }: { data: TeamBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className={cn("grid grid-cols-1 gap-4", colClass)}>
        {data.members.map((m) => (
          <div key={m.id} className="bg-foreground/5 border-t-2 border-primary rounded-b-xl p-5 text-center">
            <Avatar member={m} className="w-20 h-20 mx-auto mb-3 text-xl" />
            <p className="font-semibold">{m.name}</p>
            {m.role && <p className="text-xs text-primary mt-0.5 uppercase tracking-wider">{m.role}</p>}
            {data.showBio && m.bio && <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">{m.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: centered-feature ────────────────────────────────────────────────
// One person per row, centered, generous whitespace. For founder-led brands
// and very small teams that want each person to land.
function TeamCenteredFeature({ data }: { data: TeamBlockProps["data"] }) {
  return (
    <div className="max-w-3xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className="space-y-12">
        {data.members.map((m) => (
          <div key={m.id} className="text-center">
            <Avatar member={m} className="w-28 h-28 mx-auto mb-4 text-2xl ring-4 ring-primary/10" />
            <h3 className="text-xl font-bold">{m.name}</h3>
            {m.role && <p className="text-primary text-sm font-medium mt-1">{m.role}</p>}
            {data.showBio && m.bio && (
              <p className="text-muted-foreground leading-relaxed mt-3 max-w-xl mx-auto">{m.bio}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: bordered-grid ───────────────────────────────────────────────────
// Grid divided by hairlines instead of cards — architectural and restrained,
// suits professional services.
function TeamBorderedGrid({ data }: { data: TeamBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="max-w-6xl mx-auto">
      <TeamHead title={data.title} subtitle={data.subtitle} />
      <div className={cn("grid grid-cols-1 gap-px bg-border border border-border rounded-xl overflow-hidden", colClass)}>
        {data.members.map((m) => (
          <div key={m.id} className="bg-card p-6 text-center">
            <Avatar member={m} className="w-16 h-16 mx-auto mb-3 text-lg" />
            <p className="font-semibold text-sm">{m.name}</p>
            {m.role && <p className="text-xs text-muted-foreground mt-0.5">{m.role}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamBlock({ block }: { block: TeamBlockProps }) {
  switch (block.templateVariant) {
    case "avatar-cards": return <TeamAvatarCardsPro data={block.data} />;
    case "minimal-list": return <TeamMinimalList data={block.data} />;
    case "photo-tiles": return <TeamPhotoTiles data={block.data} />;
    case "bio-rows": return <TeamBioRows data={block.data} />;
    case "compact-grid": return <TeamCompactGrid data={block.data} />;
    case "dark-cards": return <TeamDarkCards data={block.data} />;
    case "centered-feature": return <TeamCenteredFeature data={block.data} />;
    case "bordered-grid": return <TeamBorderedGrid data={block.data} />;
  }
  const { data } = block;
  const { title, subtitle, layout, columns, members, showBio, showSocial } = data;

  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className="max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-8", colClass)}>
        {members.map((m) => (
          <div key={m.id} className={cn(
            "flex flex-col items-center text-center",
            layout === "list" && "flex-row text-left items-start gap-4",
            layout === "cards" && "bg-card border rounded-xl p-6 shadow-sm",
          )}>
            <div className={cn(
              "rounded-full overflow-hidden bg-primary/10 shrink-0",
              layout === "list" ? "w-16 h-16" : "w-24 h-24 mb-4",
            )}>
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                  {m.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{m.name}</h3>
              {m.role && <p className="text-sm text-primary font-medium">{m.role}</p>}
              {showBio && m.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.bio}</p>}
              {showSocial && m.social && m.social.length > 0 && (
                <div className="flex gap-2 mt-3 justify-center">
                  {m.social.map((s, i) => {
                    const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
                    return (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
