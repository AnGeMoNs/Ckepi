import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const sites = JSON.parse(readFileSync(new URL("../../public/data/local/sites.json", import.meta.url), "utf8"));

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("ckepi-lang", "es"));
  // This route deliberately runs without the backend. Scientific values come from
  // the shipped measured snapshots, while live analysis remains unavailable.
  await page.route("**/api/v1/**", (route) => route.request().url().endsWith("/planetary-sites")
    ? route.fulfill({ json: sites })
    : route.fulfill({ status: 503, json: { detail: { error_key: "errors.external_api_unavailable" } } }));
});

test("STEAM completes all stations, retains decisions and restarts at the next level", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/?view=app&mode=student&tab=mission");
  const route = page.getByRole("navigation", { name: "Ruta de la misión" });
  await expect(page.locator("#predict-observe")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  // Jumping ahead cannot grant a completed certificate.
  await route.getByRole("button").last().click();
  await expect(page.locator("#mission-certificate-title")).toBeVisible();
  await expect(page.getByText(/Te faltan 5 estaciones/).first()).toBeVisible();
  await route.getByRole("button").first().click();
  for (const id of ["observe", "measure", "compare", "different"]) {
    await expect(page.locator(`#predict-${id}`)).toBeVisible();
    await page.getByRole("group", { name: await page.locator(`#predict-${id}`).innerText(), exact: true }).getByRole("button").first().click();
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  }
  const answers = page.getByRole("group", { name: "¿Se puede probar en la pampa?", exact: true });
  await expect(answers.first()).toBeVisible();
  const count = await answers.count();
  for (let i = 0; i < count; i++) await answers.nth(i).getByRole("button", { name: "Sí", exact: true }).click();
  const score = await page.locator("[aria-live=polite]").first().innerText();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(answers.first().getByRole("button", { name: "Sí", exact: true })).toHaveAttribute("aria-pressed", "true");
  await answers.first().getByRole("button", { name: "Sí", exact: true }).click();
  expect(await page.locator("[aria-live=polite]").first().innerText()).toBe(score);
  await page.getByRole("button", { name: "Terminar", exact: true }).click();
  await expect(page.getByText(/Te faltan/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Subir a/ })).toBeVisible();
  await page.screenshot({ path: "/tmp/ckepi-steam-certificate.png", fullPage: true });
  await page.getByRole("button", { name: /Subir a/ }).click();
  await expect(page.locator("#predict-observe")).toBeVisible();
  await route.getByRole("button").last().click();
  await expect(page.getByText(/Te faltan 5 estaciones/).first()).toBeVisible();
});

test("STEAM at 320px has no page overflow and loads the measured activity", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/?view=app&mode=student&tab=mission");
  await expect(page.locator("#predict-observe")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: "/tmp/ckepi-steam-320.png", fullPage: true });
});
