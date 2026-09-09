import { haversineMiles, daysUntil, formatShortDate, formatLocalTime } from "../lib/geo";

describe("haversineMiles", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMiles({ lat: 51.5, lng: -0.12 }, { lat: 51.5, lng: -0.12 })).toBeCloseTo(0, 5);
  });

  it("matches the known London-Vancouver great-circle distance within a few hundred miles", () => {
    const london = { lat: 51.5072, lng: -0.1276 };
    const vancouver = { lat: 49.2827, lng: -123.1207 };
    const miles = haversineMiles(london, vancouver);
    expect(miles).toBeGreaterThan(4600);
    expect(miles).toBeLessThan(4800);
  });
});

describe("daysUntil", () => {
  it("returns 0 for today", () => {
    const now = new Date(2026, 0, 15, 22, 0, 0);
    expect(daysUntil(new Date(2026, 0, 15), now)).toBe(0);
  });

  it("counts whole calendar days regardless of time of day", () => {
    const now = new Date(2026, 0, 15, 23, 45, 0);
    expect(daysUntil(new Date(2026, 0, 18, 0, 5, 0), now)).toBe(3);
  });
});

describe("formatShortDate / formatLocalTime", () => {
  it("format without throwing and include recognizable parts", () => {
    const date = new Date(Date.UTC(2026, 10, 4, 18, 0, 0));
    expect(formatShortDate(date, "UTC")).toBe("Nov 4");
    expect(formatLocalTime(date, "UTC")).toMatch(/6:00\s?PM/);
  });
});
