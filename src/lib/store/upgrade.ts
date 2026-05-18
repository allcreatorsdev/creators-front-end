import { create } from "zustand";

type UpgradeState = {
  open: boolean;
  message: string;
  show: (message: string) => void;
  close: () => void;
};

/** Triggered globally when the API returns an out-of-credits / plan-limit
    error (codes: insufficient_credits, channel_limit). */
export const useUpgradeStore = create<UpgradeState>((set) => ({
  open: false,
  message: "",
  show: (message) => set({ open: true, message }),
  close: () => set({ open: false }),
}));
