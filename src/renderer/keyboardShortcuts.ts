import type { AppPreferences } from "../shared/types";
import type { TranslationKey } from "./i18n";

export type KeyboardShortcutId =
  | "quickSearch"
  | "preferences"
  | "toggleSidebar"
  | "splitTopic"
  | "focusPrimaryPane"
  | "focusSplitPane"
  | "closeSplitPane";

export type KeyboardShortcutMap = Record<KeyboardShortcutId, string>;

export type KeyboardShortcutDefinition = {
  id: KeyboardShortcutId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  defaultBinding: string;
};

export const keyboardShortcutDefinitions: KeyboardShortcutDefinition[] = [
  {
    id: "quickSearch",
    labelKey: "shortcuts.quickSearch.label",
    descriptionKey: "shortcuts.quickSearch.description",
    defaultBinding: "Mod+P|Mod+K"
  },
  {
    id: "preferences",
    labelKey: "shortcuts.preferences.label",
    descriptionKey: "shortcuts.preferences.description",
    defaultBinding: "Mod+,"
  },
  {
    id: "toggleSidebar",
    labelKey: "shortcuts.toggleSidebar.label",
    descriptionKey: "shortcuts.toggleSidebar.description",
    defaultBinding: "Mod+B"
  },
  {
    id: "splitTopic",
    labelKey: "shortcuts.splitTopic.label",
    descriptionKey: "shortcuts.splitTopic.description",
    defaultBinding: "Mod+\\"
  },
  {
    id: "focusPrimaryPane",
    labelKey: "shortcuts.focusPrimaryPane.label",
    descriptionKey: "shortcuts.focusPrimaryPane.description",
    defaultBinding: "Mod+1"
  },
  {
    id: "focusSplitPane",
    labelKey: "shortcuts.focusSplitPane.label",
    descriptionKey: "shortcuts.focusSplitPane.description",
    defaultBinding: "Mod+2"
  },
  {
    id: "closeSplitPane",
    labelKey: "shortcuts.closeSplitPane.label",
    descriptionKey: "shortcuts.closeSplitPane.description",
    defaultBinding: "Mod+Shift+W"
  }
];

export const defaultKeyboardShortcuts = keyboardShortcutDefinitions.reduce((shortcuts, definition) => {
  shortcuts[definition.id] = definition.defaultBinding;
  return shortcuts;
}, {} as KeyboardShortcutMap);

export function normalizeKeyboardShortcutMap(shortcuts?: Partial<KeyboardShortcutMap>): KeyboardShortcutMap {
  return {
    ...defaultKeyboardShortcuts,
    ...(shortcuts ?? {})
  };
}

export function formatShortcutForPlatform(binding: string, platform = navigator.platform) {
  const isMac = /mac/i.test(platform);
  return binding
    .split("|")
    .map((bindingPart) =>
      bindingPart
        .split("+")
        .map((part) => {
          if (part === "Mod") return isMac ? "Cmd" : "Ctrl";
          if (part === "Backslash") return "\\";
          return part;
        })
        .join("+")
    )
    .join(" / ");
}

export function createShortcutFromEvent(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Mod");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  const key = normalizeShortcutKey(event);
  if (!key || key === "Control" || key === "Meta" || key === "Alt" || key === "Shift") return "";
  parts.push(key);
  return parts.join("+");
}

export function matchesShortcut(event: KeyboardEvent, binding: string) {
  const eventShortcut = createShortcutFromEvent(event);
  return binding.split("|").some((bindingPart) => eventShortcut === bindingPart);
}

function normalizeShortcutKey(event: KeyboardEvent) {
  if (event.key === " ") return "Space";
  if (event.key === "\\") return "\\";
  if (event.code === "Backslash") return "\\";
  if (event.key.length === 1) return event.key.toUpperCase();
  return event.key;
}

export function getPreferenceShortcuts(preferences?: AppPreferences) {
  return normalizeKeyboardShortcutMap(preferences?.keyboardShortcuts);
}
