import { X } from "lucide-react";

type ConnectionError = {
  serverName: string;
  brokers: string;
  message: string;
};

type ConnectionErrorDialogProps = {
  error: ConnectionError;
  onClose: () => void;
};

export function ConnectionErrorDialog({ error, onClose }: ConnectionErrorDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="server-modal error-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-error-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-title">
          <div>
            <span className="eyebrow">Kafka connection failed</span>
            <h2 id="connection-error-title">Connect to '{error.serverName}'</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="error-summary">
          <span className="error-mark">×</span>
          <div>
            <strong>{error.brokers}</strong>
            <pre>{error.message}</pre>
          </div>
        </div>
        <div className="modal-actions">
          <button className="primary" onClick={onClose}>확인</button>
        </div>
      </section>
    </div>
  );
}
