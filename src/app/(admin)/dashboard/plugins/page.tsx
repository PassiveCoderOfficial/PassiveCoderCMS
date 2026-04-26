import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PluginToggle } from "./plugin-toggle";
import { BUILT_IN_PLUGINS } from "@/modules/plugins/built-in-plugins";

export default async function PluginsPage() {
  const supabase = await createClient();
  const { data: installedPlugins } = await supabase.from("plugins").select("*");

  const activeCount = installedPlugins?.filter((p) => p.is_active).length ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plugins</h1>
        <p className="text-muted-foreground text-sm mt-1">{activeCount} plugins active</p>
      </div>

      {/* Installed plugins */}
      {!!installedPlugins?.length && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Installed Plugins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedPlugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{plugin.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plugin.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">v{plugin.version} · {plugin.author}</p>
                    </div>
                    <Badge variant={plugin.is_active ? "success" : "outline"} className="text-xs shrink-0">
                      {plugin.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <PluginToggle pluginId={plugin.id} isActive={plugin.is_active} pluginName={plugin.name} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available plugins */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Available Plugins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILT_IN_PLUGINS.filter((p) => !installedPlugins?.find((ip) => ip.slug === p.slug)).map((plugin) => (
            <Card key={plugin.slug}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{plugin.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{plugin.name}</p>
                    <p className="text-xs text-muted-foreground">{plugin.version} · {plugin.author}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{plugin.description}</p>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <InstallPluginButton plugin={plugin} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline client component for install button
import { InstallPluginButton } from "./install-plugin-button";
