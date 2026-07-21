import { describe, expect, it } from "vitest";
import { dict, en, th } from "@/lib/i18n";
import { DESKTOP_VIEWS, MOBILE_VIEWS } from "@/lib/types";

// Collect dotted key paths, treating arrays and functions as leaves.
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...keyPaths(v, p));
    else out.push(p);
  }
  return out;
}

describe("i18n", () => {
  it("th and en have identical key structure (no drift)", () => {
    expect(keyPaths(th).sort()).toEqual(keyPaths(en).sort());
  });

  it("nav / sub / tab / title cover every view used by the shells", () => {
    const views = new Set([...DESKTOP_VIEWS, ...MOBILE_VIEWS]);
    for (const map of [en.nav, en.sub, en.tab, en.title, th.nav, th.sub, th.tab, th.title]) {
      for (const v of views) expect(map[v]).toBeTruthy();
    }
  });

  it("dict() resolves the language", () => {
    expect(dict("th")).toBe(th);
    expect(dict("en")).toBe(en);
  });
});
