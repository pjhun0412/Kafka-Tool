import { Trash2, X } from "lucide-react";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";
import type { TopicAction } from "../../uiTypes";

type TopicActionDialogProps = {
  action: NonNullable<TopicAction>;
  confirmText: string;
  loading: boolean;
  onConfirmText: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function TopicActionDialog({
  action,
  confirmText,
  loading,
  onConfirmText,
  onClose,
  onConfirm
}: TopicActionDialogProps) {
  const language = useAppLanguage();
  const isDelete = action.kind === "delete";
  const isConfirmed = confirmText.trim().toUpperCase() === action.kind.toUpperCase();

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="server-modal topic-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-action-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-title">
          <div>
            <span className="eyebrow">{t(language, isDelete ? "topicAction.deleteEyebrow" : "topicAction.purgeEyebrow")}</span>
            <h2 id="topic-action-title">{t(language, isDelete ? "topicAction.deleteTitle" : "topicAction.purgeTitle")}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title={t(language, "title.close")}>
            <X size={18} />
          </button>
        </div>
        <div className="topic-action-warning">
          <strong>{t(language, "topicAction.selected", { count: String(action.topics.length) })}</strong>
          <p>{t(language, isDelete ? "topicAction.deleteDescription" : "topicAction.purgeDescription")}</p>
          <div className="topic-action-list">
            {action.topics.map((topic) => <span key={topic}>{topic}</span>)}
          </div>
        </div>
        <label>
          {t(language, "topicAction.confirm", { word: action.kind.toUpperCase() })}
          <input value={confirmText} onChange={(event) => onConfirmText(event.target.value)} autoFocus />
        </label>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>{t(language, "action.cancel")}</button>
          <button
            className={isDelete ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={!isConfirmed || loading}
          >
            <Trash2 size={16} />
            {isDelete ? t(language, "action.delete") : t(language, "label.purge")}
          </button>
        </div>
      </section>
    </div>
  );
}
