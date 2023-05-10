import { describe, expect, it } from "vitest";
import { getTimeBucket, getTimeBucketInt } from "@/js/helpers/getTimeBucket";

const SEC = 1000;
const MN = 60 * SEC;
const HOUR = 60 * MN;
const DAY = 24 * HOUR;

const TEST_CASES: [number, number, string, number][] = [
  [0, 2 * SEC, "15s", 15 * SEC],
  [0, 14 * MN, "15s", 15 * SEC],
  [0, 1 * HOUR, "1m", 1 * MN],
  [0, 5 * HOUR, "5m", 5 * MN],
  [0, 6 * HOUR + 30 * MN, "10m", 10 * MN],
  [0, 10 * HOUR, "10m", 10 * MN],
  [0, 1 * DAY, "30m", 30 * MN],
  [0, 3 * DAY, "1h", 1 * HOUR],
  [0, 7 * DAY, "3h", 3 * HOUR],
  [0, 14 * DAY, "12h", 12 * HOUR],
  [0, 30 * DAY, "12h", 12 * HOUR],
  [0, 60 * DAY, "12h", 12 * HOUR],
];

describe("getTimeBucket", () => {
  it("should return the correct time bucket name", () => {
    for (const [start, end, expected] of TEST_CASES) {
      const result = getTimeBucket([start, end]);
      expect(result).toBe(expected);
    }
  });
});

describe("getTimeBucketInt", () => {
  it("should return the correct time bucket value", () => {
    for (const [start, end, _, expected] of TEST_CASES) {
      const result = getTimeBucketInt([start, end]);
      expect(result).toBe(expected);
    }
  });
});
