export function parseLocalizedNumber(value) {
  if (value === null || value === undefined) {
    return NaN;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "") {
    return NaN;
  }

  return Number(normalized);
}

export function isValidLocalizedNumber(value) {
  return !Number.isNaN(parseLocalizedNumber(value));
}

export function normalizeJsonDecimalCommas(jsonText) {
  return String(jsonText).replace(/(\d),(\d)/g, "$1.$2");
}

export function parseLocalizedJson(jsonText) {
  return JSON.parse(normalizeJsonDecimalCommas(jsonText));
}
