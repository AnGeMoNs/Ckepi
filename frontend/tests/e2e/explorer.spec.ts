import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const sites = JSON.parse(readFileSync(new URL("../../../backend/app/data/planetary_sites.json", import.meta.url), "utf8"));
// Controlled API fixtures exercise UI state, not scientific accuracy or live services.
function analysis(siteId: string) {
  const site = sites.find((s: { site_id: string }) => s.site_id === siteId)!;
  return {
    site_id: siteId, body: site.body, total_evaluated: 0, returned_count: 0,
    causal_weights_used: {}, matches: [],
  };
}

async function mockCatalog(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/planetary-sites")) return route.fulfill({ json: sites });
    if (path.endsWith("/analogs/search")) {
      return route.fulfill({ json: analysis(route.request().postDataJSON().site_id) });
    }
    if (path.endsWith("/decompose")) {
      const site = sites.find((s: { site_id: string }) => s.site_id === route.request().postDataJSON().site_id)!;
      return route.fulfill({ json: { site_id: site.site_id, body: site.body, model_type: "ridge",
        sample_count: 0, global_iv_weights: {}, dependent_models: [], unavailable_dvs: [],
        pca_components: [], breakage_profile: [], provenance: site.provenance } });
    }
    return route.fulfill({ status: 503, json: { detail: { error_key: "errors.external_api_unavailable" } } });
  });
}

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});

test("lunar deep link and invalid profile initialize consistently", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/analogs/search")) requests.push(request.postDataJSON().test_profile);
  });
  await page.goto("/?tab=learn&site=moon_shackleton_pole&profile=bad-profile");
  await expect(page.getByText("Tu perfil físico en Luna", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/profile=causal_auto/);
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(requests.every((profile) => profile === "causal_auto")).toBe(true);
});

test("planner draft survives evidence navigation and exports its text", async ({ page }) => {
  await page.goto("/?tab=plan");
  const title = page.getByRole("textbox").nth(0);
  const notes = page.getByRole("textbox").last();
  await title.fill("Ensayo de Angelo");
  await notes.fill("Reutilizar sensores del laboratorio");
  const equipment = page.getByRole("checkbox").nth(1);
  await equipment.check();
  await page.getByRole("button", { name: "Ver Evidencia Científica", exact: true }).click();
  await expect(page.locator("#panel-evidence")).toBeVisible();
  await expect(page.locator("#tab-learn")).toHaveCount(0);
  await expect(page.locator("#tab-plan")).toHaveCount(0);
  await expect(page.locator("#panel-evidence")).not.toContainText(/\bODS\b|\bSDGs?\b|La Araucana/i);
  await page.getByRole("button", { name: "Cambiar a Modo Estudiante", exact: true }).click();
  await page.locator("#tab-plan").click();
  await expect(title).toHaveValue("Ensayo de Angelo");
  await expect(notes).toHaveValue("Reutilizar sensores del laboratorio");
  await expect(equipment).toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exportar ficha/i }).click();
  const download = await downloadPromise;
  expect(readFileSync((await download.path())!, "utf8")).toContain("Reutilizar sensores del laboratorio");
});

test("clipboard failure stays honest and successful copy awaits browser permission", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: () => Promise.reject(new Error("Permission denied")),
    } });
  });
  await page.goto("/?tab=plan");
  await page.getByRole("button", { name: "Copiar ficha", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo copiar");
  await expect(page.getByRole("button", { name: /Copiad/ })).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: () => new Promise<void>((resolve) => { (window as any).finishCopy = resolve; }),
    } });
  });
  const button = page.getByRole("button", { name: "Copiar ficha", exact: true });
  await button.click();
  await expect(button).toBeDisabled();
  await expect(page.getByRole("button", { name: /Copiad/ })).toHaveCount(0);
  await page.evaluate(() => (window as any).finishCopy());
  await expect(page.getByRole("button", { name: /Copiad/ })).toBeVisible();
});

test("arrow keys, Home and End move both selection and keyboard focus", async ({ page }) => {
  await page.goto("/?tab=learn");
  await page.locator("#tab-learn").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-plan")).toBeFocused();
  await expect(page.locator("#tab-plan")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.locator("#tab-plan")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator("#tab-compare")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#tab-plan")).toBeFocused();

  await page.goto("/?tab=compare&mode=mission");
  await expect(page.locator("nav[role='tablist'] [role='tab']")).toHaveCount(5);
  await page.locator("#tab-compare").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-results")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#tab-compare")).toBeFocused();
});

test("local laboratory works and explains a catalog outage", async ({ page }) => {
  await page.route("**/api/v1/planetary-sites", (route) => route.abort());
  await page.goto("/?tab=learn&site=moon_shackleton_pole");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("Tu perfil físico en Luna", { exact: true })).toBeVisible();
  await page.locator("#tab-plan").click();
  await page.getByRole("textbox").nth(0).fill("Borrador sin conexión");
  await expect(page.getByRole("textbox").nth(0)).toHaveValue("Borrador sin conexión");
});

test("an unavailable analysis service shows retry guidance without suggesting different thresholds", async ({ page }) => {
  await page.route("**/api/v1/analogs/search", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/?view=app&mode=science&tab=compare");
  await expect(page.getByRole("alert")).toContainText("El servicio de análisis no pudo completar la solicitud");
  await expect(page.locator("#panel-compare")).toContainText("No se recibió un resultado válido del servicio");
  await expect(page.locator("#panel-compare")).not.toContainText("Prueba reducir los umbrales mínimos");
  await page.unroute("**/api/v1/analogs/search");
  await page.getByRole("alert").getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("#panel-compare")).toContainText("Prueba reducir los umbrales mínimos");
});

test("refreshing the analysis reuses the catalogue without calling administrative dataset refresh", async ({ page }) => {
  const administrativeCalls: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith("/datasets/refresh")) administrativeCalls.push(request.url()); });
  await page.goto("/?view=app&mode=science&tab=compare");
  const refreshed = page.waitForResponse((response) => response.url().endsWith("/analogs/search") && response.ok());
  await page.getByRole("button", { name: "Actualizar análisis", exact: true }).click();
  await refreshed;
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(administrativeCalls).toEqual([]);
});

test("mobile panels fit the viewport and untouched defaults follow the language", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?tab=plan");
  const spanishTitle = await page.getByRole("textbox").nth(0).inputValue();
  await page.locator("header button[aria-haspopup='menu']").click();
  await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
  await expect(page.getByRole("textbox").nth(0)).not.toHaveValue(spanishTitle);
  for (const tab of ["plan", "learn"]) {
    await page.locator(`#tab-${tab}`).click();
    await expect(page.locator(`#panel-${tab}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto("/?tab=evidence&mode=mission");
  await expect(page.locator("#panel-evidence")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("changing planetary sites removes previous cell data while the next query is pending", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const cellFor = (site: typeof sites[number]) => ({
    earth_cell_h3: site.body === "moon" ? "837b59fffffffff" : "82b227fffffffff",
    h3_resolution: 2, coordinates: { lat: -24.1, lon: -69.9 },
    h3_boundary: [[-24, -70], [-24, -69], [-25, -69], [-25, -70]],
    region_key: "regions.atacama", country_code: "CL", biome_key: "biomes.desert",
    is_benchmark: true, s_ind: 0.5, s_dep: 0.5, combined_score: 0.5,
    r_break_overall: 0.9, iv_similarity_breakdown: {}, dv_similarity_breakdown: {},
    breakage_alerts: [], engineering_recommendations: { viability_tier: "partial", valid_tests: [], invalid_tests: [] },
    earth_variables: site.variables, provenance: site.provenance,
  });
  let releaseMoon!: () => void;
  const moonGate = new Promise<void>((resolve) => { releaseMoon = resolve; });
  let moonRequested = false;
  await page.route("**/api/v1/analogs/search", async (route) => {
    const site = sites.find((s: { site_id: string }) => s.site_id === route.request().postDataJSON().site_id)!;
    if (site.body === "moon") { moonRequested = true; await moonGate; }
    await route.fulfill({ json: { ...analysis(site.site_id), total_evaluated: 1, returned_count: 1,
      matches: [cellFor(site)] } });
  });
  await page.route("**/api/v1/analogs/*/compare/*", (route) => {
    const site = sites.find((s: { site_id: string }) => s.site_id === new URL(route.request().url()).pathname.split("/").pop())!;
    return route.fulfill({ json: { site, match: cellFor(site), variable_deltas: [] } });
  });
  await page.goto("/?tab=analysis&mode=mission");
  await expect(page.locator("#section-diagnostics")).toContainText("82b227fffffffff");
  await page.locator("#workspace-site-select").selectOption("moon_shackleton_pole");
  await expect.poll(() => moonRequested).toBe(true);
  await expect(page.locator("#panel-analysis")).not.toContainText("82b227fffffffff");
  releaseMoon();
  await expect(page.locator("#section-diagnostics")).toContainText("837b59fffffffff");
  await expect(page.locator("#panel-analysis")).not.toContainText("82b227fffffffff");
});
