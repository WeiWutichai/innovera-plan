import { describe, expect, it } from "vitest";
import { diffDays, fmtShort, iso, parse, TODAY } from "@/lib/dates";
import { dict } from "@/lib/i18n";

describe("dates", () => {
  it("TODAY is the fixed 2026-07-12", () => {
    expect(iso(TODAY)).toBe("2026-07-12");
  });

  it("iso formats a Date as yyyy-mm-dd", () => {
    expect(iso(new Date(2026, 6, 5))).toBe("2026-07-05");
    expect(iso(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("parse round-trips an ISO string", () => {
    expect(iso(parse("2026-09-30"))).toBe("2026-09-30");
    expect(parse("2026-07-12").getTime()).toBe(TODAY.getTime());
  });

  it("diffDays is relative to TODAY (negative = past)", () => {
    expect(diffDays("2026-07-12")).toBe(0);
    expect(diffDays("2026-07-13")).toBe(1);
    expect(diffDays("2026-07-11")).toBe(-1);
    expect(diffDays("2026-07-19")).toBe(7);
    expect(diffDays("2026-05-20")).toBe(-53);
  });

  it("fmtShort localizes the month", () => {
    expect(fmtShort("2026-05-20", dict("en").mon)).toBe("20 May");
    expect(fmtShort("2026-05-20", dict("th").mon)).toBe("20 พ.ค.");
  });
});
