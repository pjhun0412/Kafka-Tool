import { DEFAULT_FONT_FAMILY } from "../../../stores/ui/layoutStore";
import { fontOptions } from "../../../uiTypes";

export function EditorFontPreferences(props: {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onFontWeight: (fontWeight: number) => void;
}) {
  return (
    <section className="preferences-page">
      <header className="preferences-page-header">
        <h3>Editor: Font</h3>
        <p>Control the font used by the topic list, message grid, JSON viewer, and editors.</p>
      </header>
      <div className="setting-card">
        <label>
          Font Family
          <span>Enter a CSS font-family list. The first installed font will be used.</span>
          <input list="font-family-options" value={props.fontFamily} onChange={(event) => props.onFontFamily(event.target.value)} placeholder={DEFAULT_FONT_FAMILY} />
          <datalist id="font-family-options">
            {fontOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </datalist>
        </label>
      </div>
      <div className="setting-card">
        <label>
          Font Size
          <span>Controls the base font size in pixels.</span>
          <input type="number" min={11} max={16} value={props.fontSize} onChange={(event) => props.onFontSize(Number(event.target.value) || 13)} />
        </label>
        <label>
          Font Weight
          <span>Controls the default UI and editor text weight.</span>
          <select value={props.fontWeight} onChange={(event) => props.onFontWeight(Number(event.target.value))}>
            <option value={400}>400</option>
            <option value={500}>500</option>
            <option value={600}>600</option>
            <option value={700}>700</option>
            <option value={800}>800</option>
            <option value={900}>900</option>
          </select>
        </label>
        <label className="font-size-slider">
          Size preview
          <input type="range" min={11} max={16} value={props.fontSize} onChange={(event) => props.onFontSize(Number(event.target.value))} />
        </label>
      </div>
      <div className="font-preview" style={{ fontWeight: props.fontWeight }}>
        <strong>proc-status-t</strong>
        <span>{"{\"system_time\":1780388670010,\"proc_id\":\"PR1001\"}"}</span>
      </div>
    </section>
  );
}
