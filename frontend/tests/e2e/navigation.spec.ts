import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const sites = JSON.parse(readFileSync(new URL("../../../backend/app/data/planetary_sites.json", import.meta.url), "utf8"));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ckepi-lang", "es"));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/planetary-sites")) return route.fulfill({ json: sites });
    const siteId = route.request().postDataJSON()?.site_id ?? "mars_jezero_crater";
    if (path.endsWith("/analogs/search")) return route.fulfill({ json: { site_id: siteId, body: "mars", total_evaluated: 0, returned_count: 0, causal_weights_used: {}, matches: [] } });
    if (path.endsWith("/decompose")) return route.fulfill({ json: { site_id: siteId, body: "mars", model_type: "ridge", sample_count: 0, global_iv_weights: {}, dependent_models: [], unavailable_dvs: [], pca_components: [], breakage_profile: [], provenance: sites[0].provenance } });
    return route.fulfill({ status: 503, json: { detail: { error_key: "errors.external_api_unavailable" } } });
  });
});

test("scientific pages show one task at a time and preserve the target through history and reload", async ({ page }) => {
  await page.goto("/?view=app&mode=science&site=mars_jezero_crater&profile=isru_ice_drilling");
  await expect(page.locator("#panel-start")).toBeVisible();
  await expect(page.locator("#section-maps")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Comparación de terreno · Jezero → Antofagasta" })).toHaveCount(0);
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await page.locator("#portal-compare").click();
  await expect(page.locator("#section-maps")).toBeVisible();
  await expect(page).toHaveURL(/tab=compare/);
  await expect(page).toHaveURL(/profile=isru_ice_drilling/);
  await page.locator("#tab-results").click();
  await expect(page.locator("#panel-results")).toBeVisible();
  await expect(page.locator("#section-maps")).toHaveCount(0);
  await page.locator("#tab-analysis").click();
  await expect(page.getByRole("button", { name: "Pampa Central · candidato", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gravedad Superficial", exact: true })).toBeHidden();
  await page.locator("#tab-evidence").click();
  await expect(page.locator("#panel-evidence")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#panel-analysis")).toBeVisible();
  await page.reload();
  await expect(page.locator("#panel-analysis")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cráter Jezero (Delta Lacustre)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/site=mars_jezero_crater/);
  await page.locator("#tab-start").click();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.locator("#portal-compare")).toBeFocused();
  await page.screenshot({ path: "/tmp/ckepi-inicio-sin-barra-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await expect(page.getByRole("tablist")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: "/tmp/ckepi-inicio-sin-barra-mobile.png", fullPage: true });
});

test("the original shared map link opens only the exploration page", async ({ page }) => {
  await page.goto("/?view=app&mode=science&site=mars_jezero_crater&profile=isru_ice_drilling#section-maps");
  await expect(page.locator("#tab-compare")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#section-maps")).toBeVisible();
  await expect(page.locator("#verified-comparison-title")).toHaveCount(0);
  await expect(page.locator("#section-ranking")).toHaveCount(0);
});
