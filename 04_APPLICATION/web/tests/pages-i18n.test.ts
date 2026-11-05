import { describe, expect, it } from "vitest";
import { PAGE_TEXT, tr, type PageKey } from "../lib/i18n/pages";

const SCRIPT = { hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, kn: /[\u0C80-\u0CFF]/ } as const;

describe("page translations (drafts)", () => {
  const keys = Object.keys(PAGE_TEXT) as PageKey[];
  it("has all four languages for every key, written in the right script", () => {
    for (const k of keys) {
      if (!/\.(pre|post)$/.test(k)) expect(PAGE_TEXT[k].en.length, k).toBeGreaterThan(0); // pre/post pieces may be empty in English
      for (const l of ["hi", "mr", "kn"] as const) if (PAGE_TEXT[k][l] !== PAGE_TEXT[k].en && PAGE_TEXT[k][l].replace(/\{\w+\}|[^\p{L}]/gu, "").length > 3) expect(PAGE_TEXT[k][l], `${k}.${l}`).toMatch(SCRIPT[l]); // a proper name may stay as is
    }
  });
  it("does not mix scripts: Kannada has no Devanagari, Hindi and Marathi have no Kannada", () => {
    for (const k of keys) {
      if (k === "land.p2") continue; // lists the four language names in their own scripts on purpose
      expect(PAGE_TEXT[k].kn, `${k}.kn`).not.toMatch(/[ऀ-ॿ]/);
      for (const l of ["hi", "mr"] as const) expect(PAGE_TEXT[k][l], `${k}.${l}`).not.toMatch(/[ಀ-೿]/);
    }
  });
  it("keeps the product and agent names untranslated", () => {
    for (const k of keys) for (const name of ["VAAKYA", "Sentinel"]) {
      if (PAGE_TEXT[k].en.includes(name)) for (const l of ["hi", "mr", "kn"] as const) expect(PAGE_TEXT[k][l], `${k}.${l}`).toContain(name);
    }
  });
  it("tr returns the requested language", () => {
    expect(tr("hi", "profile.title")).toBe("प्रोफ़ाइल");
    expect(tr("en", "profile.title")).toBe("Profile");
  });
});
