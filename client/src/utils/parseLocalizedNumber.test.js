import {
  isValidLocalizedNumber,
  normalizeJsonDecimalCommas,
  parseLocalizedJson,
  parseLocalizedNumber,
} from "./parseLocalizedNumber";

describe("parseLocalizedNumber", () => {
  it("passes numbers through", () => {
    expect(parseLocalizedNumber(42)).toBe(42);
    expect(parseLocalizedNumber(-1.5)).toBe(-1.5);
  });

  it("returns NaN for null, undefined and empty strings", () => {
    expect(parseLocalizedNumber(null)).toBeNaN();
    expect(parseLocalizedNumber(undefined)).toBeNaN();
    expect(parseLocalizedNumber("")).toBeNaN();
    expect(parseLocalizedNumber("   ")).toBeNaN();
  });

  it("parses values with a decimal comma", () => {
    expect(parseLocalizedNumber("1,5")).toBe(1.5);
    expect(parseLocalizedNumber("0,25")).toBe(0.25);
  });

  it("parses values with a decimal dot", () => {
    expect(parseLocalizedNumber("1.5")).toBe(1.5);
  });

  it("ignores spaces and trims input", () => {
    expect(parseLocalizedNumber(" 12 ")).toBe(12);
    expect(parseLocalizedNumber("1 234,5")).toBe(1234.5);
  });

  it("returns NaN for non-numeric strings", () => {
    expect(parseLocalizedNumber("abc")).toBeNaN();
  });
});

describe("isValidLocalizedNumber", () => {
  it("accepts valid numbers", () => {
    expect(isValidLocalizedNumber("3,14")).toBe(true);
    expect(isValidLocalizedNumber(7)).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidLocalizedNumber("abc")).toBe(false);
    expect(isValidLocalizedNumber(null)).toBe(false);
  });
});

describe("normalizeJsonDecimalCommas", () => {
  it("replaces commas between digits with dots", () => {
    expect(normalizeJsonDecimalCommas('{"x": 2,5}')).toBe('{"x": 2.5}');
  });

  it("keeps commas between non-digits untouched", () => {
    expect(normalizeJsonDecimalCommas('{"a": 1, "b": 2}')).toBe('{"a": 1, "b": 2}');
  });
});

describe("parseLocalizedJson", () => {
  it("parses JSON with decimal commas", () => {
    expect(parseLocalizedJson('{"threshold": 0,9}')).toEqual({ threshold: 0.9 });
  });
});
