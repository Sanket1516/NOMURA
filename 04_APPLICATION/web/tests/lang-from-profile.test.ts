import { describe, expect, it } from "vitest";
import { langFromMe } from "../lib/lang-from-profile";

describe("langFromMe (KI-19)", () => {
  it("uses the profile language on first sign-in", () => {
    expect(langFromMe({ profile: { preferred_lang: "mr" } }, undefined)).toBe("mr");
    expect(langFromMe({ profile: { preferred_lang: "kn" } }, undefined)).toBe("kn");
  });
  it("leaves English and unknown values alone", () => {
    expect(langFromMe({ profile: { preferred_lang: "en" } }, undefined)).toBeNull();
    expect(langFromMe({ profile: { preferred_lang: "fr" } }, undefined)).toBeNull();
    expect(langFromMe({ profile: null }, undefined)).toBeNull();
    expect(langFromMe(null, undefined)).toBeNull();
  });
  it("never overwrites a language the user already chose", () => {
    expect(langFromMe({ profile: { preferred_lang: "mr" } }, "hi")).toBeNull();
  });
});
