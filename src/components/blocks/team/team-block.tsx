import React from "react";
import type { TeamBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Mail, Globe } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail, website: Globe,
};

export function TeamBlock({ block }: { block: TeamBlockProps }) {
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
