"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Announce = (message: string, politeness?: "polite" | "assertive") => void;
const Ctx = createContext<Announce>(() => {});

/** One polite and one assertive live region at the root (FRONTEND_ARCHITECTURE §8). */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const announce = useCallback<Announce>((message, politeness = "polite") => {
    const set = politeness === "assertive" ? setAssertive : setPolite;
    set("");
    // Re-set on the next tick so repeated messages are announced again.
    setTimeout(() => set(message), 50);
  }, []);
  return (
    <Ctx.Provider value={announce}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">{polite}</div>
      <div aria-live="assertive" role="alert" className="sr-only">{assertive}</div>
    </Ctx.Provider>
  );
}

export const useAnnounce = () => useContext(Ctx);
