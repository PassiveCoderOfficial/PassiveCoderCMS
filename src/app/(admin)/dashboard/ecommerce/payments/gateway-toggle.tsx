"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function GatewayToggle({ gatewayId, isEnabled }: { gatewayId: string; isEnabled: boolean }) {
  const [enabled, setEnabled] = useState(isEnabled);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    const supabase = createClient();
    const { error } = await supabase.from("payment_gateways").update({ is_enabled: checked }).eq("id", gatewayId);
    if (error) { setEnabled(!checked); toast.error("Failed to update"); return; }
    toast.success(checked ? "Gateway enabled" : "Gateway disabled");
    router.refresh();
  };

  return <Switch checked={enabled} onCheckedChange={handleToggle} />;
}
