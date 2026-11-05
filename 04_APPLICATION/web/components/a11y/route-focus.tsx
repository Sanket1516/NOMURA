"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAnnounce } from "./live-region";

/** After client navigation, move focus to the page's h1 and announce the title. */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  const announce = useAnnounce();
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: false });
      announce(`${h1.textContent ?? ""} page`);
    }
  }, [pathname, announce]);
  return null;
}
