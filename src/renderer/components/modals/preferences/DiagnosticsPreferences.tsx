import type { AppLanguage } from "../../../i18n";

function labels(language: AppLanguage) {
  return language === "ko"
    ? {
        title: "Application: Diagnostics",
        description: "오류 분석을 위한 로그 파일 보관 방식을 설정합니다.",
        retention: "로그 보관 기간",
        retentionHelp: "앱 로그는 날짜별 파일로 저장되며, 이 기간이 지난 파일은 앱 시작 또는 설정 저장 시 자동 삭제됩니다.",
        days: "일"
      }
    : {
        title: "Application: Diagnostics",
        description: "Configure log files used for troubleshooting.",
        retention: "Log retention",
        retentionHelp: "App logs are written by day and older files are deleted on app start or preference save.",
        days: "days"
      };
}

export function DiagnosticsPreferences(props: {
  language: AppLanguage;
  logRetentionDays: number;
  onLogRetentionDays: (days: number) => void;
}) {
  const text = labels(props.language);
  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>{text.title}</h3>
        <p>{text.description}</p>
      </header>
      <div className="setting-card">
        <label>
          {text.retention}
          <span>{text.retentionHelp}</span>
          <div className="inline-setting-row">
            <input
              type="number"
              min={1}
              max={365}
              value={props.logRetentionDays}
              onChange={(event) => props.onLogRetentionDays(Number(event.target.value) || 14)}
            />
            <span>{text.days}</span>
          </div>
        </label>
      </div>
    </section>
  );
}
