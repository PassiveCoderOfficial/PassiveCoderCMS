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

export function TeamBlock({ block }: { block: TeamBlockProps }) {
  if (block.templateVariant === "avatar-cards") return <TeamAvatarCardsPro data={block.data} />;
  if (block.templateVariant === "minimal-list") return <TeamMinimalList data={block.data} />;
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
            layout === "cards" && "bg-white border rounded-xl p-6 shadow-sm",
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
