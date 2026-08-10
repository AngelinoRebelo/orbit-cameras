"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CAMERAS, createShareCode, type Camera } from "./data";

export type GridLayout = 1 | 4 | 9 | 16;
export type ArmedMode = "home" | "away" | "disarmed";

interface OrbitState {
  cameras: Camera[];
  removedCameraIds: string[];
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
  updateCamera: (id: string, patch: Partial<Camera>) => void;
  removeCamera: (id: string) => void;
  removeCameras: (ids: string[]) => void;
}

function buildFleet(removedIds: string[], custom: Camera[]) {
  const removed = new Set(removedIds);
  const seedIds = new Set(CAMERAS.map((c) => c.id));
  const extras = custom.filter((c) => !seedIds.has(c.id) && !removed.has(c.id));
  const seeds = CAMERAS.filter((c) => !removed.has(c.id));
  return [...extras, ...seeds];
}

export const useOrbitStore = create<OrbitState>()(
  persist(
    (set, get) => ({
      cameras: CAMERAS,
      removedCameraIds: [],
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
      addCamera: (cam) =>
        set({
          cameras: [cam, ...get().cameras.filter((c) => c.id !== cam.id)],
          removedCameraIds: get().removedCameraIds.filter((id) => id !== cam.id),
          selectedCameraId: cam.id,
        }),
      updateCamera: (id, patch) =>
        set({
          cameras: get().cameras.map((c) =>
            c.id === id ? { ...c, ...patch, id: c.id } : c,
          ),
        }),
      removeCamera: (id) => {
        const cameras = get().cameras.filter((c) => c.id !== id);
        const removedCameraIds = Array.from(
          new Set([...get().removedCameraIds, id]),
        );
        set({
          cameras,
          removedCameraIds,
          selectedCameraId:
            get().selectedCameraId === id
              ? cameras[0]?.id ?? ""
              : get().selectedCameraId,
        });
      },
      removeCameras: (ids) => {
        const drop = new Set(ids);
        const cameras = get().cameras.filter((c) => !drop.has(c.id));
        const removedCameraIds = Array.from(
          new Set([...get().removedCameraIds, ...ids]),
        );
        set({
          cameras,
          removedCameraIds,
          selectedCameraId: drop.has(get().selectedCameraId)
            ? cameras[0]?.id ?? ""
            : get().selectedCameraId,
        });
      },
    }),
    {
      name: "orbit-cameras-v4",
      partialize: (s) => ({
        cameras: s.cameras,
        removedCameraIds: s.removedCameraIds,
        selectedCameraId: s.selectedCameraId,
        grid: s.grid,
        armed: s.armed,
        shareCode: s.shareCode,
        shareExpiresAt: s.shareExpiresAt,
        muted: s.muted,
        nightMode: s.nightMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<OrbitState> | undefined;
        if (!p) return current;
        const removedCameraIds = p.removedCameraIds ?? [];
        const seedIds = new Set(CAMERAS.map((c) => c.id));
        const custom = (p.cameras ?? []).filter((c) => !seedIds.has(c.id));
        const cameras = buildFleet(removedCameraIds, custom);
        return {
          ...current,
          ...p,
          removedCameraIds,
          cameras,
          selectedCameraId:
            p.selectedCameraId &&
            cameras.some((c) => c.id === p.selectedCameraId)
              ? p.selectedCameraId
              : cameras[0]?.id ?? "",
        };
      },
    },
  ),
);
