import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, CheckCircle } from "lucide-react";
import { ThemeActions } from "./theme-actions";
import { InstallThemeButton } from "./install-theme-button";
import { BUILT_IN_THEMES } from "@/modules/themes/built-in-themes";

export default async function ThemesPage() {
  const supabase = await createClient();
  const { data: installedThemes } = await supabase.from("themes").select("*").order("created_at");
  const activeTheme = installedThemes?.find((t) => t.is_active);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Themes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeTheme ? `Active theme: ${activeTheme.name}` : "No theme active — install and activate one below"}
        </p>
      </div>

      {/* Installed themes */}
      {!!installedThemes?.length && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Installed Themes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {installedThemes.map((theme) => (
              <Card key={theme.id} className={theme.is_active ? "ring-2 ring-primary" : ""}>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl overflow-hidden">
                    {theme.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={theme.thumbnail} alt={theme.name} className="w-full h-full object-cover" />
                    )}
                    {theme.is_active && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Active
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">v{theme.version} · {theme.author}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <ThemeActions theme={theme} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available themes */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Available Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BUILT_IN_THEMES.filter((t) => !installedThemes?.find((it) => it.slug === t.slug)).map((theme) => (
            <Card key={theme.slug}>
              <CardContent className="p-0">
                <div className="relative aspect-video rounded-t-xl overflow-hidden" style={{ background: theme.preview_gradient }}>
                  {theme.thumbnail && <img src={theme.thumbnail} alt={theme.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <InstallThemeButton theme={theme} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
