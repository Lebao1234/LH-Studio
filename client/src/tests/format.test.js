import { describe, expect, it } from "vitest"
import {
  big,
  formatDate,
  formatVND,
  formatVNDCompact,
  groupDigits,
  initials,
  percent,
  toDateInput,
} from "@/lib/utils/format"

describe("Client Format Utilities", () => {
  describe("groupDigits and Currency formatting", () => {
    it("groups digits with dots for VND display", () => {
      expect(groupDigits("50000000")).toBe("50.000.000")
      expect(groupDigits("1234567890")).toBe("1.234.567.890")
      expect(groupDigits("1000")).toBe("1.000")
      expect(groupDigits("500")).toBe("500")
    })

    it("handles negative numbers, leading zeros and invalid values", () => {
      expect(groupDigits("-1500000")).toBe("-1.500.000")
      expect(groupDigits("0001234")).toBe("1.234")
      expect(groupDigits("")).toBe("0")
      expect(groupDigits(null)).toBe("0")
      expect(groupDigits(undefined)).toBe("0")
    })

    it("formats VND with currency symbol", () => {
      expect(formatVND("50000000")).toBe("50.000.000 ₫")
      expect(formatVND(0)).toBe("0 ₫")
    })

    it("formats compact VND for dashboard tiles and charts", () => {
      expect(formatVNDCompact(50000000)).toMatch(/50\s*tr/)
      expect(formatVNDCompact(1500000000)).toMatch(/1[,.]5\s*tỷ/)
      expect(formatVNDCompact(500000)).toMatch(/500k/)
    })
  });

  describe("BigInt conversion", () => {
    it("safely converts valid values to BigInt without throwing", () => {
      expect(big("50000000000")).toBe(50000000000n)
      expect(big(100)).toBe(100n)
      expect(big(0)).toBe(0n)
    })

    it("defaults to 0n on null, undefined or malformed string", () => {
      expect(big(null)).toBe(0n)
      expect(big(undefined)).toBe(0n)
      expect(big("invalid_number")).toBe(0n)
    })
  });

  describe("Date formatting", () => {
    it("formats ISO date to Vietnamese standard dd/MM/yyyy", () => {
      const formatted = formatDate("2026-10-19T08:00:00.000Z")
      expect(formatted).toMatch(/19\/10\/2026/)
    })

    it("returns placeholder dash when date is null or invalid", () => {
      expect(formatDate(null)).toBe("—")
      expect(formatDate("invalid-date")).toBe("—")
    })

    it("converts ISO date to YYYY-MM-DD for HTML date input", () => {
      expect(toDateInput("2026-10-19T10:00:00.000Z")).toMatch(/2026-10-19/)
      expect(toDateInput(null)).toBe("")
    })
  });

  describe("Initials extraction", () => {
    it("extracts last two words initials for avatars", () => {
      expect(initials("Lê Hoàng")).toBe("LH")
      expect(initials("Nguyễn Văn An")).toBe("VA")
      expect(initials("Admin")).toBe("A")
      expect(initials("")).toBe("?")
      expect(initials(undefined)).toBe("?")
    })
  });

  describe("Percentage calculation", () => {
    it("calculates integer percent correctly", () => {
      expect(percent(5, 10)).toBe(50)
      expect(percent(1, 3)).toBe(33)
      expect(percent(10, 10)).toBe(100)
    })

    it("handles zero total safely without dividing by zero", () => {
      expect(percent(0, 0)).toBe(0)
      expect(percent(5, 0)).toBe(0)
    })
  });
});
