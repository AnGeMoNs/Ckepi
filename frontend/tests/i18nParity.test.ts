import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else {
      out[key] = String(v ?? "");
    }
  }
  return out;
}

test("es, pt, and en locales have identical non-empty i18n keys", () => {
  const dir = path.resolve("src/i18n");
  const es = flatten(JSON.parse(fs.readFileSync(path.join(dir, "es.json"), "utf8")));
  const pt = flatten(JSON.parse(fs.readFileSync(path.join(dir, "pt.json"), "utf8")));
  const en = flatten(JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8")));

  const esKeys = Object.keys(es).sort();
  const ptKeys = Object.keys(pt).sort();
  const enKeys = Object.keys(en).sort();

  assert.deepEqual(ptKeys, esKeys, "pt.json keys must match es.json");
  assert.deepEqual(enKeys, esKeys, "en.json keys must match es.json");

  for (const key of esKeys) {
    assert.ok(es[key].trim().length > 0, `Empty es value for ${key}`);
    assert.ok(pt[key].trim().length > 0, `Empty pt value for ${key}`);
    assert.ok(en[key].trim().length > 0, `Empty en value for ${key}`);
  }
});
