import { expect, test } from "@playwright/test";

// Integration checks use the running FastAPI service and a disposable copy of its datasets.
// They never call the AI provider or administrative refresh endpoints.
test("scientific product connects real ranking, measured pitch evidence and physical limits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("ckepi-lang", "es");
    localStorage.setItem("ckepi-theme", "dark");
  });
  const search = page.waitForResponse((response) => response.url().endsWith("/analogs/search") && response.status() === 200);
  await page.goto("/?view=app&mode=science");
  await expect(page.getByRole("heading", { name: "Compara mundos. Elige dónde ensayar." })).toBeVisible();
  const result = await (await search).json();
  expect(result.total_evaluated).toBeGreaterThan(10000);
  expect(result.returned_count).toBe(250);
  await page.locator("#tab-results").click();
  await expect(page.locator("#section-discovery")).toBeVisible();
  await expect(page.locator("#section-maps")).toHaveCount(0);
  await page.locator("#tab-analysis").click();
  const demo = page.locator("section").filter({ has: page.getByRole("heading", { name: "Comparación de terreno · Jezero → Antofagasta" }) });
  await expect(demo).toContainText("0,54°");
  await expect(demo).toContainText("3,32°");
  await expect(demo).toContainText("6,92°");
  const candidateCard = demo.getByRole("button", { name: "Pampa Central · candidato", exact: true });
  const negativeCard = demo.getByRole("button", { name: "Contraejemplo", exact: true });
  await candidateCard.click();
  await expect(candidateCard).toHaveAttribute("aria-expanded", "true");
  await expect(candidateCard).toContainText("preseleccionar esta ventana");
  await negativeCard.click();
  await expect(negativeCard).toHaveAttribute("aria-expanded", "true");
  await expect(candidateCard).toHaveAttribute("aria-expanded", "false");
  await expect(negativeCard).toContainText("pendientes mucho más abruptas");
  await demo.locator("summary").filter({ hasText: "Límites físicos" }).click();
  await expect(demo.getByRole("button", { name: "Radiación Ionizante (GCR)", exact: true })).toContainText("mSv/año");
  await demo.getByRole("button", { name: "Ver histogramas, escala y fuentes" }).click();
  await expect(demo).toContainText("Copernicus");
  await expect(demo.locator("svg").first()).toBeVisible();
  await page.locator("#tab-evidence").click();
  await expect(page.locator("#panel-evidence")).toBeVisible();
  await expect(page.locator("#panel-evidence")).not.toContainText(/\bODS\b|\bSDGs?\b/);
  expect(errors).toEqual([]);
});

test("320px English light theme keeps product identity and a single student workflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("ckepi-lang", "en");
    localStorage.setItem("ckepi-theme", "light");
  });
  await page.goto("/?view=app&mode=student");
  await expect(page.getByRole("heading", { name: "Where on Earth can we test for the Moon and Mars?" })).toBeVisible();
  const artwork = page.locator(".product-world img");
  await expect(artwork).toHaveCount(3);
  await expect.poll(() => artwork.evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "View the deliverable", exact: true }).click();
  await expect(page.locator("#panel-plan")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("#tab-learn")).toBeVisible();
});
