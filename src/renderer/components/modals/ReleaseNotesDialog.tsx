import { Sparkles, X } from "lucide-react";
import { getReleaseNote } from "../../releaseNotes";
import type { AppLanguage } from "../../i18n";

export function ReleaseNotesDialog(props: {
  version: string;
  language: AppLanguage;
  onClose: () => void;
}) {
  const note = getReleaseNote(props.version, props.language);
  if (!note) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={props.onClose}>
      <section className="server-modal release-notes-modal" role="dialog" aria-modal="true" aria-labelledby="release-notes-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> Release Notes
            </span>
            <h2 id="release-notes-title">{note.title}</h2>
          </div>
          <button className="modal-close" onClick={props.onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="release-notes-body">
          {note.sections.map((section, index) => (
            <div key={index} className="release-notes-section">
              {section.heading && (
                <p className="release-notes-heading">{section.heading}</p>
              )}
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="primary" onClick={props.onClose}>
            {props.language === "ko" ? "확인" : "Done"}
          </button>
        </div>
      </section>
    </div>
  );
}
