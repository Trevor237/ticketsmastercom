import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Settings = {
  id: number;
  platform_name: string;
  tagline: string;
  service_fee_percent: number;
  currency: string;
  maintenance_mode: boolean;
  hero_image_url: string | null;
  contact_email: string | null;
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) setSettings(data as Settings);
      });

    const ch = supabase
      .channel("settings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (payload) => {
          if (payload.new) setSettings(payload.new as Settings);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return settings;
}
