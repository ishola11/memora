import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, LogOut } from "lucide-react";
import { authLogin, authLogout, getDevices, getSyncState, openSettings } from "@/lib/api";
import type { DeviceInfo, SyncState } from "@memora/shared-types";

export function SettingsPanel() {
  const [state, setState] = useState<SyncState | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [sync, devs] = await Promise.all([getSyncState(), getDevices()]);
    setState(sync);
    setDevices(devs);
    if (sync.userEmail) setEmail(sync.userEmail);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sync = await authLogin(email, password);
      setState(sync);
      setPassword("");
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const sync = await authLogout();
      setState(sync);
      setPassword("");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            {state.loggedIn ? (
              <Cloud className="h-5 w-5 text-indigo-400" />
            ) : (
              <CloudOff className="h-5 w-5 text-zinc-500" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold">Memora Settings</h1>
            <p className="text-xs text-zinc-500">Cloud sync & devices</p>
          </div>
        </div>

        {!state.configured && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Supabase not configured. Copy <code className="text-xs">.env.example</code> to{" "}
            <code className="text-xs">apps/desktop/.env</code> and add your project URL + anon key.
          </div>
        )}

        {state.loggedIn ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Signed in</p>
              <p className="mt-1 font-medium">{state.userEmail}</p>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>{state.pendingCount} pending</span>
                {state.lastSyncAt && (
                  <span>Last sync {new Date(state.lastSyncAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Devices
              </p>
              <div className="space-y-2">
                {devices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm"
                  >
                    <span>
                      {d.name}
                      {d.isCurrent && (
                        <span className="ml-2 text-xs text-indigo-400">this device</span>
                      )}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${d.isOnline ? "bg-green-400" : "bg-zinc-600"}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!state.configured}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!state.configured}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !state.configured}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in to sync
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function openSettingsWindow() {
  void openSettings();
}
