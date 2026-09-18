"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";

export function GatewayToggle({ gatewayId, isEnabled }: { gatewayId: string; isEnabled: boolean }) {
  const t = useT();
  const [enabled, setEnabled] = useState(isEnabled);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    const supabase = createClient();
    const { error } = await supabase.from("payment_gateways").update({ is_enabled: checked }).eq("id", gatewayId);
    if (error) { setEnabled(!checked); toast.error(t("payments.failedToUpdate")); return; }
    toast.success(checked ? t("payments.gatewayEnabled") : t("payments.gatewayDisabled"));
    router.refresh();
  };

  return <Switch checked={enabled} onCheckedChange={handleToggle} />;
}
