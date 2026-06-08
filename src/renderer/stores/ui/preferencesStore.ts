import { create } from "zustand";

export type PreferencePage = "editor-font" | "export-log" | "avro-schemas";
export type PreferenceGroup = "editor" | "export" | "avro";

type PreferencesStore = {
  isPreferencesOpen: boolean;
  activePreferencesPage: PreferencePage;
  collapsedPreferenceGroups: Record<PreferenceGroup, boolean>;
  preferencesQuery: string;
  setIsPreferencesOpen: (isPreferencesOpen: boolean) => void;
  setActivePreferencesPage: (activePreferencesPage: PreferencePage) => void;
  setCollapsedPreferenceGroups: (collapsedPreferenceGroups: Record<PreferenceGroup, boolean>) => void;
  setPreferencesQuery: (preferencesQuery: string) => void;
  togglePreferenceGroup: (group: PreferenceGroup) => void;
  openPreferences: (page?: PreferencePage) => void;
  openPreferencesSection: (section?: "avro" | "editor") => void;
};

const collapsedGroups: Record<PreferenceGroup, boolean> = {
  editor: true,
  export: true,
  avro: true
};

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  isPreferencesOpen: false,
  activePreferencesPage: "editor-font",
  collapsedPreferenceGroups: collapsedGroups,
  preferencesQuery: "",
  setIsPreferencesOpen: (isPreferencesOpen) => set({ isPreferencesOpen }),
  setActivePreferencesPage: (activePreferencesPage) => set({ activePreferencesPage }),
  setCollapsedPreferenceGroups: (collapsedPreferenceGroups) => set({ collapsedPreferenceGroups }),
  setPreferencesQuery: (preferencesQuery) => set({ preferencesQuery }),
  togglePreferenceGroup: (group) => set((current) => ({
    collapsedPreferenceGroups: {
      ...current.collapsedPreferenceGroups,
      [group]: !current.collapsedPreferenceGroups[group]
    }
  })),
  openPreferences: (page = "editor-font") => set({
    activePreferencesPage: page,
    preferencesQuery: "",
    isPreferencesOpen: true
  }),
  openPreferencesSection: (section) => set({
    activePreferencesPage: section === "avro" ? "avro-schemas" : "editor-font",
    collapsedPreferenceGroups: collapsedGroups,
    preferencesQuery: "",
    isPreferencesOpen: true
  })
}));
