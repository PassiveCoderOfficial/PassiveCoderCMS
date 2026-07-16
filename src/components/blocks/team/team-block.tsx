import React from "react";
import type { TeamBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Mail, Globe } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail, website: Globe,
};

// ─── Variant: avatar-cards ─────────────────────────────────────────────────
// Rounded-square initial avatars in a per-member brand color, tight 3-up grid,
// no card border — manufacturing/corporate/B2B.
function TeamAvatarCards({ data }: { data: TeamBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="max-w-3xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-8">
          {data.subtitle && <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-primary">{data.subtitle}</p>}
          {data.title && <h2 className="text-2xl font-extrabold">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-6", colClass)}>
        {data.members.map((m) => (
          <div key={m.id} className="text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-xl mb-3 shadow-lg">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                m.name.charAt(0)
              )}
            </div>
            <h3 className="font-bold text-sm">{m.name}</h3>
            {m.role && <p className="text-xs font-medium text-primary mb-1">{m.role}</p>}
            {data.showBio && m.bio && <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{m.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamBlock({ block }: { block: TeamBlockProps }) {
  if (block.templateVariant === "avatar-cards") return <TeamAvatarCards data={block.data} />;
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
