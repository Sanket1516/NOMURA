import "server-only";
import { createHash, randomBytes } from "node:crypto";

export function pkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
export const randomToken = () => randomBytes(24).toString("base64url");
