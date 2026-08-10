"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CAMERAS, createShareCode, type Camera } from "./data";

export type GridLayout = 1 | 4 | 9 | 16;
export type ArmedMode = "home" | "away" | "disarmed";

interface OrbitState {
  cameras: Camera[];
  selectedCameraId: string;
  grid: GridLayout;
  armed: ArmedMode;
  shareCode: string;
  shareExpiresAt: string;
  muted: boolean;
  nightMode: boolean;
  setSelected: (id: string) => void;
  setGrid: (g: GridLayout) => void;
  setArmed: (m: ArmedMode) => void;
  toggleMute: () => void;
  toggleNight: () => void;
  refreshShare: () => void;
  addCamera: (cam: Camera) => void;
}

export const useOrbitStore = create<OrbitState>()(
  persist(
    (set, get) => ({
      cameras: CAMERAS,
      selectedCameraId: CAMERAS[0].id,
      grid: 4,
      armed: "home",
      shareCode: createShareCode(),
      shareExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      muted: true,
      nightMode: false,
      setSelected: (id) => set({ selectedCameraId: id }),
      setGrid: (grid) => set({ grid }),
      setArmed: (armed) => set({ armed }),
      toggleMute: () => set({ muted: !get().muted }),
      toggleNight: () => set({ nightMode: !get().nightMode }),
      refreshShare: () =>
        set({
          shareCode: createShareCode(),
          shareExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
        }),
      addCamera: (cam) => set({ cameras: [cam, ...get().cameras] }),
    }),
    {
      name: "orbit-cameras",
      partialize: (s) => ({
        selectedCameraId: s.selectedCameraId,
        grid: s.grid,
        armed: s.armed,
        shareCode: s.shareCode,
        shareExpiresAt: s.shareExpiresAt,
        muted: s.muted,
        nightMode: s.nightMode,
      }),
    },
  ),
);
