import { isLang } from "./i18n/nav";
import type { Lang } from "./types";

/** The interface language to set on first sign-in from `/v1/me`, or null to leave the cookie alone.
 *  English is the default, so only hi, mr and kn need a cookie. A language the user picked themselves is never overwritten. */
export function langFromMe(me: unknown, existingCookie: string | undefined): Lang | null {
  if (isLang(existingCookie)) return null;
  const v = (me as { profile?: { preferred_lang?: unknown } } | null)?.profile?.preferred_lang;
  return isLang(v) && v !== "en" ? v : null;
}
