import type { Dispatch, SetStateAction } from "react";

export function ExportLogPreferences(props: {
  exportFormatTemplate: string;
  onExportFormatTemplate: Dispatch<SetStateAction<string>>;
}) {
  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>Export: Log Format</h3>
        <p>Customize the downloadable LOG format used by message exports.</p>
      </header>
      <div className="setting-card">
        <label>
          User Format: Log Export
          <span>Use placeholders to build one line per Kafka message.</span>
          <textarea
            className="format-template-editor"
            value={props.exportFormatTemplate}
            onChange={(event) => props.onExportFormatTemplate(event.target.value)}
            placeholder="[{timestamp}] {topic}[{partition}]@{offset} key={key} value={value}"
          />
        </label>
      </div>
      <div className="format-help">
        Placeholders: {"{timestamp}"}, {"{topic}"}, {"{partition}"}, {"{offset}"}, {"{key}"}, {"{headers}"}, {"{value}"}
      </div>
    </section>
  );
}
