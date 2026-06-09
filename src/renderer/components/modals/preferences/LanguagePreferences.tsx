import type { AppLanguage, LanguagePreference } from "../../../i18n";
import { t } from "../../../i18n";

const languageOptions: LanguagePreference[] = ["auto", "ko", "en"];

export function LanguagePreferences(props: {
  language: LanguagePreference;
  resolvedLanguage: AppLanguage;
  onLanguage: (language: LanguagePreference) => void;
}) {
  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>{t(props.resolvedLanguage, "settings.language.title")}</h3>
        <p>{t(props.resolvedLanguage, "settings.language.description")}</p>
      </header>
      <div className="setting-card">
        <label>
          {t(props.resolvedLanguage, "settings.language.field")}
          <span>{t(props.resolvedLanguage, "settings.language.help")}</span>
          <select value={props.language} onChange={(event) => props.onLanguage(event.target.value as LanguagePreference)}>
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {t(props.resolvedLanguage, `settings.language.${language}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="setting-note">
          {t(props.resolvedLanguage, "settings.language.resolved")}: {t(props.resolvedLanguage, `settings.language.${props.resolvedLanguage}`)}
        </div>
      </div>
    </section>
  );
}
