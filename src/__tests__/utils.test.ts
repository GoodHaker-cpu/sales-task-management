import {
  getCurrentISTDateTime,
  formatISTDate,
  isValidISTFormat,
  parseISTDate,
  compareISTDates,
  isTaskOverdue,
} from "@/lib/utils";

describe("IST Date Utilities", () => {
  test("isValidISTFormat accepts valid format", () => {
    expect(isValidISTFormat("2026:06:21:14:30:45")).toBe(true);
  });

  test("isValidISTFormat rejects invalid formats", () => {
    expect(isValidISTFormat("21/06/2026")).toBe(false);
    expect(isValidISTFormat("2026-06-21")).toBe(false);
    expect(isValidISTFormat("06-21-2026")).toBe(false);
  });

  test("getCurrentISTDateTime returns valid IST format", () => {
    const result = getCurrentISTDateTime();
    expect(isValidISTFormat(result)).toBe(true);
  });

  test("formatISTDate formats Date object to IST string", () => {
    const date = new Date("2026-06-21T09:00:45.000Z");
    const formatted = formatISTDate(date);
    expect(isValidISTFormat(formatted)).toBe(true);
  });

  test("parseISTDate parses valid IST string", () => {
    const parsed = parseISTDate("2026:06:21:14:30:45");
    expect(parsed).toBeInstanceOf(Date);
  });

  test("parseISTDate throws on invalid format", () => {
    expect(() => parseISTDate("2026-06-21")).toThrow();
  });

  test("compareISTDates compares correctly", () => {
    expect(compareISTDates("2026:06:26:09:30:00", "2026:06:25:18:00:00")).toBeGreaterThan(0);
    expect(compareISTDates("2026:06:25:18:00:00", "2026:06:26:09:30:00")).toBeLessThan(0);
  });

  test("isTaskOverdue detects overdue tasks", () => {
    expect(isTaskOverdue("2026:06:15:18:00:00", "PENDING")).toBe(true);
    expect(isTaskOverdue("2099:06:25:18:00:00", "PENDING")).toBe(false);
    expect(isTaskOverdue("2026:06:15:18:00:00", "COMPLETED")).toBe(false);
  });
});
