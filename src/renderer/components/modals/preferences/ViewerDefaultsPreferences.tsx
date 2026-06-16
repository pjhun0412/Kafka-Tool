import type { AppPreferences } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import type { MessageInspectorMode, MessagePayloadFormat, TopicConsumeState } from "../../../uiTypes";

type ConsumeDefaults = NonNullable<AppPreferences["consumeDefaults"]>;

export function ViewerDefaultsPreferences(props: {
  consumeDefaults: ConsumeDefaults;
  retentionDays: number;
  onConsumeDefaults: (defaults: ConsumeDefaults) => void;
  onRetentionDays: (days: number) => void;
}) {
  const language = useAppLanguage();

  function updateDefaults(patch: ConsumeDefaults) {
    props.onConsumeDefaults({
      ...props.consumeDefaults,
      ...patch
    });
  }

  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>{t(language, "preferences.viewer.title")}</h3>
        <p>{t(language, "preferences.viewer.description")}</p>
      </header>
      <div className="setting-card settings-grid two-column">
        <label>
          {t(language, "preferences.viewer.defaultTab")}
          <span>{t(language, "preferences.viewer.defaultTabHelp")}</span>
          <select
            value={props.consumeDefaults.inspectorMode ?? "raw"}
            onChange={(event) => updateDefaults({ inspectorMode: event.target.value as MessageInspectorMode })}
          >
            <option value="raw">{t(language, "label.raw")}</option>
            <option value="tree">{t(language, "label.tree")}</option>
            <option value="preview">{t(language, "label.preview")}</option>
          </select>
        </label>
        <label>
          {t(language, "preferences.viewer.encoding")}
          <span>{t(language, "preferences.viewer.encodingHelp")}</span>
          <select
            value={props.consumeDefaults.payloadEncoding ?? "utf-8"}
            onChange={(event) => updateDefaults({ payloadEncoding: event.target.value as TopicConsumeState["payloadEncoding"] })}
          >
            <option value="utf-8">UTF-8</option>
            <option value="euc-kr">EUC-KR</option>
          </select>
        </label>
        <label>
          {t(language, "preferences.viewer.keyFormat")}
          <span>{t(language, "preferences.viewer.keyFormatHelp")}</span>
          <select
            value={props.consumeDefaults.keyFormat ?? "text"}
            onChange={(event) => updateDefaults({ keyFormat: event.target.value as TopicConsumeState["keyFormat"] })}
          >
            <option value="text">{t(language, "label.previewText")}</option>
            <option value="hex">{t(language, "label.previewHex")}</option>
            <option value="base64">{t(language, "label.previewBase64")}</option>
          </select>
        </label>
        <label>
          {t(language, "preferences.viewer.valueFormat")}
          <span>{t(language, "preferences.viewer.valueFormatHelp")}</span>
          <select
            value={props.consumeDefaults.valueFormat ?? "json"}
            onChange={(event) => updateDefaults({ valueFormat: event.target.value as MessagePayloadFormat })}
          >
            <option value="text">{t(language, "label.previewText")}</option>
            <option value="json">{t(language, "label.previewJson")}</option>
            <option value="hex">{t(language, "label.previewHex")}</option>
            <option value="base64">{t(language, "label.previewBase64")}</option>
          </select>
        </label>
      </div>
      <div className="setting-card">
        <label>
          {t(language, "preferences.viewer.retention")}
          <span>{t(language, "preferences.viewer.retentionHelp")}</span>
          <select value={props.retentionDays} onChange={(event) => props.onRetentionDays(Number(event.target.value))}>
            <option value={30}>{t(language, "preferences.viewer.retention30")}</option>
            <option value={90}>{t(language, "preferences.viewer.retention90")}</option>
            <option value={180}>{t(language, "preferences.viewer.retention180")}</option>
            <option value={365}>{t(language, "preferences.viewer.retention365")}</option>
            <option value={0}>{t(language, "preferences.viewer.retentionNever")}</option>
          </select>
        </label>
      </div>
      <div className="format-help">{t(language, "preferences.viewer.note")}</div>
    </section>
  );
}
