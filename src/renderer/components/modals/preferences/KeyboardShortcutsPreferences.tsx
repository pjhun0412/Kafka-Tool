import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type { AppKeyboardShortcutPreferences } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import {
  createShortcutFromEvent,
  defaultKeyboardShortcuts,
  formatShortcutForPlatform,
  keyboardShortcutDefinitions,
  type KeyboardShortcutId,
  type KeyboardShortcutMap
} from "../../../keyboardShortcuts";

export function KeyboardShortcutsPreferences(props: {
  keyboardShortcuts: KeyboardShortcutMap;
  onKeyboardShortcuts: (shortcuts: AppKeyboardShortcutPreferences) => void;
}) {
  const language = useAppLanguage();
  const [recordingId, setRecordingId] = useState<KeyboardShortcutId | null>(null);

  function updateShortcut(id: KeyboardShortcutId, binding: string) {
    props.onKeyboardShortcuts({
      ...props.keyboardShortcuts,
      [id]: binding
    });
  }

  function resetShortcut(id: KeyboardShortcutId) {
    updateShortcut(id, defaultKeyboardShortcuts[id]);
  }

  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>{t(language, "preferences.shortcuts.title")}</h3>
        <p>{t(language, "preferences.shortcuts.description")}</p>
      </header>
      <div className="shortcut-list">
        {keyboardShortcutDefinitions.map((definition) => {
          const binding = props.keyboardShortcuts[definition.id] || definition.defaultBinding;
          const isRecording = recordingId === definition.id;
          return (
            <div className="shortcut-row" key={definition.id}>
              <div className="shortcut-copy">
                <strong>{t(language, definition.labelKey)}</strong>
                <span>{t(language, definition.descriptionKey)}</span>
              </div>
              <button
                className={isRecording ? "shortcut-recorder recording" : "shortcut-recorder"}
                type="button"
                onClick={() => setRecordingId(definition.id)}
                onBlur={() => setRecordingId(null)}
                onKeyDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.key === "Escape") {
                    setRecordingId(null);
                    return;
                  }
                  const nextBinding = createShortcutFromEvent(event.nativeEvent);
                  if (!nextBinding || !nextBinding.includes("Mod+")) return;
                  updateShortcut(definition.id, nextBinding);
                  setRecordingId(null);
                }}
              >
                {isRecording ? t(language, "preferences.shortcuts.recording") : formatShortcutForPlatform(binding)}
              </button>
              <button
                className="shortcut-reset"
                type="button"
                onClick={() => resetShortcut(definition.id)}
                title={t(language, "preferences.shortcuts.reset")}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="setting-note">{t(language, "preferences.shortcuts.note")}</div>
    </section>
  );
}
