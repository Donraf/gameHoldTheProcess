import { getRemTime, getRemTimeRaw, millisToMinutesAndSeconds } from "./getTimeDiff";
import { vi } from "vitest";

describe("millisToMinutesAndSeconds", () => {
  it("formats zero", () => {
    expect(millisToMinutesAndSeconds(0)).toBe("0:00");
  });

  it("pads seconds with a leading zero", () => {
    expect(millisToMinutesAndSeconds(61000)).toBe("1:01");
  });

  it("formats minutes and seconds", () => {
    expect(millisToMinutesAndSeconds(10 * 60 * 1000 + 59 * 1000)).toBe("10:59");
  });
});

describe("getRemTimeRaw", () => {
  const limit = 45 * 60 * 1000;

  it("returns the full limit when the session has not started", () => {
    expect(getRemTimeRaw(null, limit)).toBe(limit);
  });

  it("returns zero when the time is up", () => {
    const longAgo = new Date(Date.now() - limit - 1000).toISOString();
    expect(getRemTimeRaw(longAgo, limit)).toBe(0);
  });

  it("returns the remaining time for an active session", () => {
    const elapsed = 5 * 60 * 1000;
    const spy = vi.spyOn(Date, "now").mockReturnValue(1_000_000_000_000);
    const start = new Date(Date.now() - elapsed).toISOString();

    expect(getRemTimeRaw(start, limit)).toBe(limit - elapsed);

    spy.mockRestore();
  });
});

describe("getRemTime", () => {
  it("returns the formatted limit when the session has not started", () => {
    expect(getRemTime(null, 10 * 60 * 1000)).toBe("10:00");
  });

  it("returns 0:00 when the time is up", () => {
    const limit = 10 * 60 * 1000;
    const longAgo = new Date(Date.now() - limit - 1000).toISOString();
    expect(getRemTime(longAgo, limit)).toBe("0:00");
  });
});
