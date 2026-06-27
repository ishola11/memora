import { useEffect, useState } from "react";
import { Check, Cloud } from "lucide-react";
import { onSyncTransfer } from "@/lib/api";
import type { SyncTransfer } from "@memora/shared-types";

export function SyncToast() {
  const [toast, setToast] = useState<SyncTransfer | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    void onSyncTransfer((transfer) => {
      setToast(transfer);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setToast(null), 3500);
    }).then((unlisten) => () => {
      if (hideTimer) clearTimeout(hideTimer);
      unlisten();
    });
  }, []);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-2">
      <div className="w-80 rounded-xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
            <Cloud className="h-4 w-4 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100">Synced to cloud</p>
            <p className="truncate text-xs text-zinc-400">{toast.title}</p>
            {toast.onlineDevices.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-zinc-500">Available on:</p>
                {toast.onlineDevices.map((name) => (
                  <p key={name} className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Check className="h-3 w-3 text-green-400" />
                    {name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
