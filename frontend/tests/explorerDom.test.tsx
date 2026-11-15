import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost/", pretendToBeVisual: true,
});
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Event", "KeyboardEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} } as any);
window.HTMLElement.prototype.scrollIntoView = () => {};
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: i18n } = await import("../src/i18n");
const { clearApiCache } = await import("../src/api/client");
const { ExplorerPage } = await import("../src/pages/ExplorerPage");
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
async function render(search: string) {
  window.history.replaceState({}, "", `/${search}`);
  await act(async () => { root.render(<ExplorerPage theme="dark" readingMode="mission" />); });
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
  const element = [...document.querySelectorAll("button")].find((node) => node.textContent?.trim() === text);
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
  await waitFor(() => document.body.textContent!.includes("Tu perfil físico en Luna"), "Moon lab not shown");
  await waitFor(() => fetchCalls.some((r) => r.path.endsWith("analogs/search")), "Analysis did not run");
  assert.ok(fetchCalls.filter((r) => r.path.endsWith("analogs/search")).every((r) => r.body.test_profile === "causal_auto"));
  assert.ok(window.location.search.includes("profile=causal_auto"));
});

test("DOM: draft text and equipment survive round trip to Evidence", async () => {
  await render("?tab=plan");
  await waitFor(() => !!document.querySelector("#panel-plan input[type=text]"), "Planner not loaded");
  await input(document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!, "Ensayo de Angelo");
  const notes = document.querySelectorAll<HTMLTextAreaElement>("#panel-plan textarea")[1];
  await input(notes, "Reutilizar sensores");
  await click("#panel-plan input[type=checkbox]:not(:checked)");
  const checked = document.querySelectorAll("#panel-plan input[type=checkbox]:checked").length;
  await click("#tab-evidence");
  await waitFor(() => !!document.querySelector("#panel-evidence"), "Evidence not loaded");
  await click("#tab-plan");
  await waitFor(() => !!document.querySelector("#panel-plan"), "Planner not restored");
  assert.equal(document.querySelector<HTMLInputElement>("#panel-plan input[type=text]")!.value, "Ensayo de Angelo");
  assert.equal(document.querySelectorAll<HTMLTextAreaElement>("#panel-plan textarea")[1].value, "Reutilizar sensores");
  assert.equal(document.querySelectorAll("#panel-plan input[type=checkbox]:checked").length, checked);
});

test("DOM: copying reports failure, waits for resolution and exports the edited text", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("Denied")) } });
  await render("?tab=plan");
  await waitFor(() => !!document.querySelector("#panel-plan input"), "Planner not loaded");
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

test("DOM: keyboard tabs move focus and selection together", async () => {
  await render("?tab=plan");
  document.getElementById("tab-plan")!.focus();
  for (const [key, expected] of [["ArrowRight", "evidence"], ["ArrowLeft", "plan"], ["End", "evidence"], ["Home", "compare"], ["ArrowLeft", "evidence"]]) {
    await act(async () => document.activeElement!.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true })));
    assert.equal(document.activeElement?.id, `tab-${expected}`);
    assert.equal(document.activeElement?.getAttribute("aria-selected"), "true");
  }
});

test("DOM: language changes update untouched defaults but preserve the user's edits", async () => {
  await render("?tab=plan");
  await waitFor(() => !!document.querySelector("#panel-plan input"), "Planner not loaded");
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
  await render("?tab=learn&site=moon_shackleton_pole");
  await waitFor(() => !!document.querySelector("[role=alert]"), "Missing outage notice");
  await waitFor(() => document.body.textContent!.includes("Tu perfil físico en Luna"), "Local lab unavailable");
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
  await render("?tab=plan");
  await waitFor(() => document.querySelector("#panel-plan")?.textContent?.includes("82b227fffffffff") ?? false, "Initial match missing");
  await click("#tab-compare");
  await act(async () => {
    const select = document.getElementById("target-site-select") as HTMLSelectElement;
    select.value = "moon_shackleton_pole";
    select.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  await click("#tab-plan");
  assert.ok(!document.querySelector("#panel-plan")?.textContent?.includes("82b227fffffffff"));
  await waitFor(() => pending.length === 2, "Moon requests not started");
  await click("#tab-compare");
  await act(async () => {
    const select = document.getElementById("target-site-select") as HTMLSelectElement;
    select.value = "mars_jezero_crater";
    select.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  await click("#tab-plan");
  await waitFor(() => document.querySelector("#panel-plan")?.textContent?.includes("82b227fffffffff") ?? false, "Mars match not restored");
  await act(async () => { pending.forEach((release) => release()); });
  assert.ok(document.querySelector("#panel-plan")?.textContent?.includes("82b227fffffffff"));
  assert.ok(!document.querySelector("#panel-plan")?.textContent?.includes("837b59fffffffff"));
  assert.ok(window.location.search.includes("site=mars_jezero_crater"));
});
