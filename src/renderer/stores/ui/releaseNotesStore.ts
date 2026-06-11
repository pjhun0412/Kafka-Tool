import { create } from "zustand";

type ReleaseNotesStore = {
  isReleaseNotesOpen: boolean;
  releaseNotesVersion: string;
  openReleaseNotes: (version?: string) => void;
  closeReleaseNotes: () => void;
};

export const useReleaseNotesStore = create<ReleaseNotesStore>((set) => ({
  isReleaseNotesOpen: false,
  releaseNotesVersion: "",
  openReleaseNotes: (version = "") => set({
    isReleaseNotesOpen: true,
    releaseNotesVersion: version
  }),
  closeReleaseNotes: () => set({ isReleaseNotesOpen: false })
}));
