import { create } from "zustand";

export type ActionToastKind = "success" | "error";

interface ActionToastState {
  message: string | null;
  kind: ActionToastKind;
  showActionToast: (message: string, kind?: ActionToastKind) => void;
  clearActionToast: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useActionToastStore = create<ActionToastState>((set) => ({
  message: null,
  kind: "success",
  showActionToast: (message, kind = "success") => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, kind });
    hideTimer = setTimeout(() => set({ message: null }), 2000);
  },
  clearActionToast: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));
