import { Trash2, X } from "lucide-react";
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
            <span className="eyebrow">Topic {action.kind}</span>
            <h2 id="topic-action-title">{isDelete ? "Delete selected topics" : "Purge selected topics"}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="topic-action-warning">
          <strong>{action.topics.length} topic(s) selected</strong>
          <p>
            {isDelete
              ? "Delete removes the selected topics from the cluster."
              : "Purge keeps the topics, but removes records up to the current high offsets."}
          </p>
          <div className="topic-action-list">
            {action.topics.map((topic) => <span key={topic}>{topic}</span>)}
          </div>
        </div>
        <label>
          Type {action.kind.toUpperCase()} to confirm
          <input value={confirmText} onChange={(event) => onConfirmText(event.target.value)} autoFocus />
        </label>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button
            className={isDelete ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={!isConfirmed || loading}
          >
            <Trash2 size={16} />
            {isDelete ? "Delete" : "Purge"}
          </button>
        </div>
      </section>
    </div>
  );
}
