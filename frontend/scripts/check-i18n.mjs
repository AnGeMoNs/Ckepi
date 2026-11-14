import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.resolve(__dirname, "../src/i18n");

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? flattenKeys(v, prefix ? `${prefix}.${k}` : k)
      : [prefix ? `${prefix}.${k}` : k]
  );
}

const locales = ["es", "pt", "en"].map((lang) => ({
  lang,
  keys: new Set(
    flattenKeys(JSON.parse(fs.readFileSync(path.join(i18nDir, `${lang}.json`), "utf8")))
  ),
}));

const union = new Set(locales.flatMap((l) => [...l.keys]));
let hasMissing = false;

for (const { lang, keys } of locales) {
  const missing = [...union].filter((k) => !keys.has(k));
  if (missing.length > 0) {
    hasMissing = true;
    console.error(`[${lang}] Missing ${missing.length} keys:`, missing);
  } else {
    console.log(`[${lang}] OK (${keys.size} keys)`);
  }
}

if (hasMissing) {
  process.exit(1);
}
