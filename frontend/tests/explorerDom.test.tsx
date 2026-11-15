import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost/", pretendToBeVisual: true,
});
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Event", "KeyboardEvent", "getComputedStyle"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} } as any);
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};
// jsdom has no IntersectionObserver; framer-motion's in-view animations need one. Report everything as visible.
class VisibleIntersectionObserver {
  constructor(private callback: (entries: { isIntersecting: boolean; target: Element }[]) => void) {}
  observe(target: Element) { this.callback([{ isIntersecting: true, target }]); }
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, value: VisibleIntersectionObserver });
(window as any).IntersectionObserver = VisibleIntersectionObserver;
const { act, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: i18n } = await import("../src/i18n");
const { clearApiCache } = await import("../src/api/client");
const { ExplorerPage } = await import("../src/pages/ExplorerPage");
const { FieldTrialPlanner } = await import("../src/components/planning/FieldTrialPlanner");
const { createFieldTrialDraft } = await import("../src/utils/fieldTrialDraft");
const { Header } = await import("../src/components/layout/Header");
const sites = JSON.parse(readFileSync("../backend/app/data/planetary_sites.json", "utf8"));
let root: ReturnType<typeof createRoot>;
let fetchCalls: { path: string; body: any }[];
const realFetch = globalThis.fetch;

function cellFor(site: any) {
  return { earth_cell_h3: site.body === "moon" ? "837b59fffffffff" : "82b227fffffffff",
    h3_resolution: 2, coordinates: { lat: -24.1, lon: -69.9 }, h3_boundary: [],
    region_key: "regions.atacama", country_code: "CL", biome_key: "biomes.desert",
    is_benchmark: true, s_ind: 0.5, s_dep: 0.5, combined_score: 0.5, r_break_overall: 0.9,
    iv_similarity_breakdown: {}, dv_similarity_breakdown: {}, breakage_alerts: [],
    engineering_recommendations: { viability_tier: "partial", valid_tests: [], invalid_tests: [] },
    earth_variables: site.variables, provenance: site.provenance };
}

function mockApi(_input: string | URL | Request, init?: RequestInit) {
  const path = String(_input);
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  fetchCalls.push({ path, body });
  if (path.endsWith("planetary-sites")) return Promise.resolve(Response.json(sites));
  const siteId = body.site_id ?? path.split("/").pop()?.split("?")[0];
  const site = sites.find((s: any) => s.site_id === siteId) ?? sites[0];
  if (path.includes("/compare/")) return Promise.resolve(Response.json({
    site, match: cellFor(site), variable_deltas: [] }));
  if (path.endsWith("decompose")) return Promise.resolve(Response.json({ site_id: site.site_id,
    body: site.body, model_type: "ridge", sample_count: 0, global_iv_weights: {},
    dependent_models: [], unavailable_dvs: [], pca_components: [], breakage_profile: [], provenance: site.provenance }));
  if (path.endsWith("analogs/search")) return Promise.resolve(Response.json({ site_id: site.site_id,
    body: site.body, total_evaluated: 1, returned_count: 1, causal_weights_used: {}, matches: [cellFor(site)] }));
  return Promise.resolve(Response.json({ detail: { error_key: "errors.external_api_unavailable" } }, { status: 503 }));
}

async function waitFor(check: () => boolean, message: string) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  }
  assert.fail(message);
}
function ExplorerHarness({ initialMode }: { initialMode: "explorer" | "mission" }) {
  const [mode, setMode] = useState<"explorer" | "mission">(initialMode);
  return <><Header theme="dark" onToggleTheme={() => {}} readingMode={mode} onChangeReadingMode={setMode} /><ExplorerPage theme="dark" readingMode={mode} onChangeReadingMode={setMode} /></>;
}

async function render(search: string, mode: "explorer" | "mission" = "explorer") {
  window.history.replaceState({}, "", `/${search}`);
  await act(async () => { root.render(<ExplorerHarness initialMode={mode} />); });
}
async function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  assert.ok(element, `Missing element ${selector}`);
  await act(async () => element.click());
}
async function input(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
function button(text: string) {
  const element = [...document.querySelectorAll("button")].find((node) => (node.getAttribute("aria-label") ?? node.textContent?.trim()) === text);
  assert.ok(element, `Missing button ${text}`);
  return element;
}

beforeEach(async () => {
  fetchCalls = [];
  clearApiCache();
  globalThis.fetch = mockApi as typeof fetch;
  await i18n.changeLanguage("es");
  root = createRoot(document.getElementById("root")!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  globalThis.fetch = realFetch;
});

test("DOM: lunar link and invalid profile use the correct body and API profile", async () => {
  await render("?tab=learn&site=moon_shackleton_pole&profile=invalid");
  await waitFor(() => !!document.querySelector("#lab-title"), "Moon lab not shown");
  await waitFor(() => fetchCalls.some((r) => r.path.endsWith("analogs/search")), "Analysis did not run");
  assert.ok(fetchCalls.filter((r) => r.path.endsWith("analogs/search")).every((r) => r.body.test_profile === "causal_auto"));
  assert.ok(window.location.search.includes("profile=causal_auto"));
  assert.ok(fetchCalls.filter((r) => r.path.endsWith("analogs/search")).every((r) => r.body.site_id === "moon_shackleton_pole"));
});

function PlannerHarness() {
  const [draft, setDraft] = useState(createFieldTrialDraft);
  const [evidence, setEvidence] = useState(false);
  return evidence ? <button onClick={() => setEvidence(false)}>Volver al borrador</button> : <div id="panel-plan"><FieldTrialPlanner draft={draft} onDraftChange={setDraft} onGoToCompare={() => {}} onGoToEvidence={() => setEvidence(true)} /></div>;
}
async function renderPlanner() {
  await act(async () => { root.render(<PlannerHarness />); });
}
test("DOM: isolated planner preserves edits and equipment across its evidence callback", async () => {
  await renderPlanner();
  await input(document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!, "Ensayo de Angelo");
  const notes = document.querySelectorAll<HTMLTextAreaElement>("#panel-plan textarea")[1];
  await input(notes, "Reutilizar sensores");
  await click("#panel-plan input[type=checkbox]:not(:checked)");
  const checked = document.querySelectorAll("#panel-plan input[type=checkbox]:checked").length;
  await act(async () => button("Ver Evidencia Científica").click());
  await act(async () => button("Volver al borrador").click());
  assert.equal(document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!.value, "Ensayo de Angelo");
  assert.equal(document.querySelectorAll<HTMLTextAreaElement>("#panel-plan textarea")[1].value, "Reutilizar sensores");
  assert.equal(document.querySelectorAll("#panel-plan input[type=checkbox]:checked").length, checked);
});

test("DOM: copying reports failure, waits for resolution and exports the edited text", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("Denied")) } });
  await renderPlanner();
  await input(document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!, "Ensayo propio");
  await act(async () => button("Copiar ficha").click());
  assert.ok(document.querySelector("[role=alert]")?.textContent?.includes("No se pudo copiar"));
  assert.equal(button("Copiar ficha").disabled, false);
  let resolveCopy!: () => void;
  let copied = "";
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
    writeText: (text: string) => { copied = text; return new Promise<void>((resolve) => { resolveCopy = resolve; }); },
  } });
  await act(async () => button("Copiar ficha").click());
  assert.equal(button("Copiar ficha").disabled, true);
  assert.ok(copied.startsWith("# Ensayo propio"));
  await act(async () => resolveCopy());
  assert.equal(button("Copiado").disabled, false);
});

test("DOM: keyboard tabs move focus and selection together in both modes", async () => {
  await render("?tab=plan", "explorer");
  document.getElementById("tab-mission")!.focus();
  for (const [key, expected] of [["ArrowRight", "learn"], ["ArrowLeft", "mission"], ["Home", "mission"], ["ArrowRight", "learn"], ["End", "compare"]]) {
    await act(async () => document.activeElement!.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true })));
    assert.equal(document.activeElement?.id, `tab-${expected}`);
    assert.equal(document.activeElement?.getAttribute("aria-selected"), "true");
  }

  await act(async () => root.unmount());
  root = createRoot(document.getElementById("root")!);
  await render("?tab=compare&mode=mission", "mission");
  document.getElementById("tab-compare")!.focus();
  for (const [key, expected] of [["ArrowRight", "results"], ["ArrowLeft", "compare"], ["End", "evidence"], ["Home", "start"], ["ArrowLeft", "evidence"]]) {
    await act(async () => document.activeElement!.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true })));
    assert.equal(document.activeElement?.id, `tab-${expected}`);
    assert.equal(document.activeElement?.getAttribute("aria-selected"), "true");
  }
});

test("DOM: scientific pages separate the workspace without SDGs in Sources", async () => {
  await render("?tab=evidence&mode=mission", "mission");
  await waitFor(() => !!document.querySelector("#panel-evidence"), "Evidence not loaded");
  assert.equal(document.querySelectorAll("nav[role='tablist'] [role='tab']").length, 5);
  assert.ok(document.getElementById("tab-compare"));
  assert.ok(document.getElementById("tab-evidence"));
  assert.equal(document.getElementById("tab-learn"), null);
  assert.equal(document.getElementById("tab-plan"), null);
  const evidenceText = document.querySelector("#panel-evidence")!.textContent ?? "";
  assert.ok(evidenceText.includes("NASA"));
  assert.ok(evidenceText.includes("AI_DISCLOSURE.md"));
  assert.equal(/\bODS\b|\bSDGs?\b|La Araucana/i.test(evidenceText), false);
});

test("DOM: scientific mode normalizes ?tab=learn or ?tab=plan back to compare", async () => {
  await render("?tab=learn", "mission");
  assert.equal(document.getElementById("tab-compare")?.getAttribute("aria-selected"), "true");
  assert.equal(document.getElementById("panel-learn"), null);
  await act(async () => root.unmount());
  root = createRoot(document.getElementById("root")!);
  await render("?tab=plan", "mission");
  assert.equal(document.getElementById("tab-compare")?.getAttribute("aria-selected"), "true");
  assert.equal(document.getElementById("panel-plan"), null);
});

test("DOM: language changes update untouched defaults but preserve the user's edits", async () => {
  await renderPlanner();
  const title = document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!;
  const spanish = title.value;
  await act(async () => { await i18n.changeLanguage("en"); });
  assert.notEqual(title.value, spanish);
  await input(title, "Mi ensayo");
  await act(async () => { await i18n.changeLanguage("pt"); });
  assert.equal(title.value, "Mi ensayo");
});

test("DOM: the local laboratory remains usable during a catalog failure", async () => {
  globalThis.fetch = (() => Promise.reject(new Error("Offline"))) as typeof fetch;
  await render("?tab=learn&site=moon_shackleton_pole", "explorer");
  await waitFor(() => !!document.querySelector("[role=alert]"), "Missing outage notice");
  await waitFor(() => !!document.querySelector("#lab-title"), "Local lab unavailable");
});

test("DOM: changing sites hides previous measurements and ignores late responses", async () => {
  const pending: (() => void)[] = [];
  globalThis.fetch = ((url, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (body.site_id === "moon_shackleton_pole") {
      // Deliberately ignore AbortSignal to model a response already in transit.
      return new Promise<Response>((resolve) => pending.push(() => resolve(mockApi(url, init))));
    }
    return mockApi(url, init);
  }) as typeof fetch;
  await render("?tab=analysis&mode=mission", "mission");
  await waitFor(() => document.querySelector("#section-diagnostics")?.textContent?.includes("82b227fffffffff") ?? false, "Initial match missing");
  await act(async () => {
    button("Luna").click();
  });
  assert.ok(!document.querySelector("#panel-analysis")?.textContent?.includes("82b227fffffffff"));
  await waitFor(() => pending.length === 2, "Moon requests not started");
  await act(async () => {
    button("Marte").click();
  });
  await waitFor(() => document.querySelector("#section-diagnostics")?.textContent?.includes("82b227fffffffff") ?? false, "Mars match not restored");
  await act(async () => { pending.forEach((release) => release()); });
  assert.ok(document.querySelector("#section-diagnostics")?.textContent?.includes("82b227fffffffff"));
  assert.ok(!document.querySelector("#panel-analysis")?.textContent?.includes("837b59fffffffff"));
  assert.ok(window.location.search.includes("site=mars_jezero_crater"));
});
