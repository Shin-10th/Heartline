import { computeOverlapWindows } from "../services/goldenHour";

describe("computeOverlapWindows", () => {
  it("finds a positive-duration overlap for two same-hours awake windows in different zones", () => {
    const slots = computeOverlapWindows(
      "Europe/London",
      { startHour: 7, endHour: 23 },
      "America/Vancouver",
      { startHour: 7, endHour: 23 }
    );
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.durationMin).toBeGreaterThan(0);
      expect(new Date(slot.startUtc).toString()).not.toBe("Invalid Date");
    }
  });

  it("sorts candidates longest-first", () => {
    const slots = computeOverlapWindows(
      "Europe/London",
      { startHour: 7, endHour: 23 },
      "America/Vancouver",
      { startHour: 7, endHour: 23 }
    );
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i - 1].durationMin).toBeGreaterThanOrEqual(slots[i].durationMin);
    }
  });

  it("returns no slots when two narrow daytime windows are offset by roughly half a day", () => {
    // A 2-hour morning window in London and the same local 2-hour morning
    // window in Auckland (~11-13h ahead) can't overlap -- one side's
    // daytime is the other's deep night.
    const slots = computeOverlapWindows(
      "Europe/London",
      { startHour: 7, endHour: 9 },
      "Pacific/Auckland",
      { startHour: 7, endHour: 9 }
    );
    expect(slots.length).toBe(0);
  });
});
