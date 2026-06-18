export type ProduceTemplateDraft = {
  key: string;
  headers: string;
  value: string;
};

const tokenPattern = /\\?\$\{([^}]+)\}/g;

type ParsedOptions = Record<string, string>;

function parseOptions(optionText = ""): ParsedOptions {
  return optionText.split("|").reduce<ParsedOptions>((options, option) => {
    const [key, ...valueParts] = option.split("=");
    if (key && valueParts.length > 0) options[key.trim()] = valueParts.join("=").trim();
    return options;
  }, {});
}

function parseRange(expression: string) {
  const match = /^(-?\d+)\.{2,3}(-?\d+)(?:\|(.+))?$/.exec(expression.trim());
  if (!match) return null;
  const [, startText, endText, optionText = ""] = match;
  const start = Number(startText);
  const end = Number(endText);
  const options = parseOptions(optionText);
  const inferredPad = /^0\d+/.test(startText) || /^0\d+/.test(endText)
    ? Math.max(startText.replace(/^-/, "").length, endText.replace(/^-/, "").length)
    : 0;
  return {
    start,
    end,
    options,
    pad: options.pad ? Number(options.pad) : inferredPad
  };
}

function parseFloatRange(expression: string) {
  const match = /^(-?\d+(?:\.\d+)?)\.{2,3}(-?\d+(?:\.\d+)?)(?:\|(.+))?$/.exec(expression.trim());
  if (!match) return null;
  const [, startText, endText, optionText = ""] = match;
  return {
    start: Number(startText),
    end: Number(endText),
    options: parseOptions(optionText)
  };
}

function formatPadded(value: number, pad: number) {
  if (!pad) return String(value);
  const sign = value < 0 ? "-" : "";
  return `${sign}${String(Math.abs(value)).padStart(pad, "0")}`;
}

function rangedValue(expression: string, iteration: number) {
  const range = parseRange(expression);
  if (!range) return String(iteration);
  const direction = range.end >= range.start ? 1 : -1;
  const size = Math.abs(range.end - range.start) + 1;
  const offset = (Math.max(1, iteration) - 1) % size;
  return formatPadded(range.start + offset * direction, range.pad);
}

function randomInt(min: number, max: number) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  return String(Math.floor(Math.random() * (high - low + 1)) + low);
}

function randomFloat(expression: string) {
  const range = parseFloatRange(expression);
  if (!range) return "";
  const min = Math.min(range.start, range.end);
  const max = Math.max(range.start, range.end);
  const value = Math.random() * (max - min) + min;
  const fixed = range.options.fixed ? Number(range.options.fixed) : NaN;
  return Number.isFinite(fixed) ? value.toFixed(Math.max(0, Math.min(12, fixed))) : String(value);
}

function padDatePart(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function formatDate(date: Date, format: string) {
  const replacements: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: padDatePart(date.getMonth() + 1),
    dd: padDatePart(date.getDate()),
    HH: padDatePart(date.getHours()),
    mm: padDatePart(date.getMinutes()),
    ss: padDatePart(date.getSeconds()),
    SSS: padDatePart(date.getMilliseconds(), 3)
  };
  return format.replace(/yyyy|SSS|MM|dd|HH|mm|ss/g, (token) => replacements[token] ?? token);
}

function renderToken(token: string, iteration: number) {
  const [kind, ...rest] = token.split(":");
  const expression = rest.join(":");
  const normalizedKind = kind.trim().toLowerCase();

  if (normalizedKind === "seq") return rangedValue(expression, iteration);
  if (normalizedKind === "number" || normalizedKind === "random") {
    const range = parseRange(expression);
    return range ? randomInt(range.start, range.end) : "";
  }
  if (normalizedKind === "float") return randomFloat(expression);
  if (normalizedKind === "choice") {
    const choices = expression.split("|").filter(Boolean);
    return choices.length ? choices[Math.floor(Math.random() * choices.length)] : "";
  }
  if (normalizedKind === "now") {
    const now = new Date();
    return expression ? formatDate(now, expression) : now.toISOString();
  }
  if (normalizedKind === "timestamp") {
    const now = new Date();
    if (!expression) return String(now.getTime());
    if (expression === "s" || expression === "seconds") return String(Math.floor(now.getTime() / 1000));
    return String(now.getTime());
  }
  if (normalizedKind === "date") return formatDate(new Date(), expression || "yyyy-MM-dd HH:mm:ss");
  if (normalizedKind === "uuid") return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `\${${token}}`;
}

export function renderProduceTemplateText(input: string, iteration: number) {
  return input.replace(tokenPattern, (match, token: string) => {
    if (match.startsWith("\\")) return match.slice(1);
    return renderToken(token, iteration);
  });
}

export function renderProduceTemplateDraft(draft: ProduceTemplateDraft, iteration: number): ProduceTemplateDraft {
  return {
    key: renderProduceTemplateText(draft.key, iteration),
    headers: renderProduceTemplateText(draft.headers, iteration),
    value: renderProduceTemplateText(draft.value, iteration)
  };
}

export function getProduceTemplateHints() {
  return ["${seq}", "${seq:1..100|pad=7}", "${random:1..100}", "${float:0..1|fixed=2}", "${choice:A|B|C}", "${date:yyyy-MM-dd HH:mm:ss}", "${uuid}"];
}

export function getProduceTemplateExamples() {
  return [
    { syntax: "${seq}", description: "Sequential values starting at 1 with no upper limit." },
    { syntax: "${seq:1..10}", description: "Sequential values, wraps inside the range." },
    { syntax: "VMS${seq:1..100|pad=7}", description: "Padded IDs such as VMS0000001." },
    { syntax: "${random:1..100}", description: "Random integer in the range." },
    { syntax: "${float:0..1|fixed=2}", description: "Random decimal with fixed digits." },
    { syntax: "${choice:READY|RUNNING|ERROR}", description: "Randomly picks one value." },
    { syntax: "${timestamp}", description: "Current epoch milliseconds." },
    { syntax: "${timestamp:s}", description: "Current epoch seconds." },
    { syntax: "${date:yyyy-MM-dd HH:mm:ss}", description: "Formatted current local date/time." },
    { syntax: "${now}", description: "Current ISO date/time." },
    { syntax: "${uuid}", description: "Random UUID." },
    { syntax: "\\${uuid}", description: "Escapes a token and sends it as literal text." }
  ];
}

export function parseProduceDurationMs(input: string) {
  const compact = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!compact) return 0;
  const tokenPattern = /(\d+(?:\.\d+)?)(ms|s|m|h)/g;
  let total = 0;
  let matched = "";
  for (const match of compact.matchAll(tokenPattern)) {
    const amount = Number(match[1]);
    const unit = match[2];
    matched += match[0];
    if (unit === "ms") total += amount;
    if (unit === "s") total += amount * 1000;
    if (unit === "m") total += amount * 60 * 1000;
    if (unit === "h") total += amount * 60 * 60 * 1000;
  }
  return matched === compact ? Math.floor(total) : 0;
}

export function formatProduceElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
