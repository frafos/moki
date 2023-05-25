
import { formatValueISO } from "@/js/helpers/formatValue";
import { describe, expect, it } from "vitest"

describe("formatValueISO", () => {
  const testCases: [number, string][] = [
    [123456789, "123.46M"],
    [9876543210, "9.88G"],
    [1234567.89, "1.23M"],
    [1234.56, "1.23k"],
    [1200, "1.2k"],
    [121, "121"],
    [0.192381, "0.19"],
    [0, "0"],
    [NaN, ""],
    [undefined, ""],
    [null, ""],
    ["abc" as any, ""],
  ];

  testCases.forEach(([value, expected]) => {
    it(`should format ${value} as ${expected}`, () => {
      const formattedValue = formatValueISO(value);
      expect(formattedValue).toBe(expected);
    });
  });
});


