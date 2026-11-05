// T0.06 licence check for npm packages (NFR-LIC-01, D-026).
// Reads every package recorded in package-lock.json from node_modules and fails on any licence
// expression containing a term that is not on the allow-list. Same policy as api/licence_check.py.
import { readFileSync } from "node:fs";

const ALLOWED = [/^MIT(-0)?$/i, /^BSD-[23]-Clause$/i, /^0BSD$/i, /^Apache-2\.0$/i, /^ISC$/i,
  /^MPL-2\.0$/i, /^CC0-1\.0$/i, /^CC-BY-4\.0$/i, /^Unlicense$/i, /^BlueOak-1\.0\.0$/i,
  /^Python-2\.0$/i, /^LGPL-3\.0(-or-later|-only)?$/i, /^Zlib$/i];

export function terms(expr) {
  return String(expr ?? "").split(/\s*(?:\bAND\b|\bOR\b|\bWITH\b|\(|\))\s*/).map((t) => t.trim()).filter(Boolean);
}
export function isAllowed(expr) {
  const t = terms(expr);
  return t.length > 0 && t.every((term) => ALLOWED.some((re) => re.test(term)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const bad = [];
  let count = 0;
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    // Installed packages are read from node_modules. Optional packages for other platforms are not
    // installed, so their licence is taken from the lockfile entry instead.
    let pkg = { name: path.replace(/^.*node_modules\//, ""), version: entry.version, license: entry.license };
    try { pkg = JSON.parse(readFileSync(`${path}/package.json`, "utf8")); } catch { /* use lockfile entry */ }
    count++;
    const lic = typeof pkg.license === "object" ? pkg.license?.type : pkg.license;
    if (!isAllowed(lic)) bad.push(`${pkg.name}@${pkg.version} [${lic}]`);
  }
  console.log(`${count} packages in lockfile checked, ${bad.length} need review`);
  for (const b of bad) console.log("REVIEW", b);
  process.exit(bad.length ? 1 : 0);
}
