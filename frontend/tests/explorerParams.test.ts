import assert from "node:assert/strict";
import test from "node:test";
import { readExplorerParams } from "../src/utils/explorerParams";
import {
  ApiClientError,
  compareCellWithSite,
  fetchPlanetarySites,
  probeEarthCoordinate,
  probePlanetaryLocation,
  runDecomposition,
} from "../src/api/client";

test("shared lunar links initialize the lab for the Moon", () => {
  const params = readExplorerParams("?tab=learn&site=moon_shackleton_pole&profile=rover_mobility");
  assert.equal(params.body, "moon");
  assert.equal(params.tab, "learn");
  assert.equal(params.profile, "rover_mobility");
  assert.equal(readExplorerParams("?site=probe_moon_-10_20").body, "moon");
});

test("invalid URL options fall back to supported API values", () => {
  const params = readExplorerParams("?tab=invalid&site=&profile=invalid&discovery=true&penalize=1");
  assert.equal(params.tab, "compare");
  assert.equal(params.siteId, "mars_jezero_crater");
  assert.equal(params.profile, "causal_auto");
  assert.equal(params.discovery, false);
  assert.equal(params.penalize, true);
});

test("API client returns a translated error for malformed successful JSON", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Proxy unavailable</html>", { status: 200 }));
  await assert.rejects(fetchPlanetarySites(), (error: unknown) =>
    error instanceof ApiClientError && error.errorKey === "errors.invalid_response");
});

test("API cancellation preserves AbortError and passes the signal to decomposition", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.equal(init.signal, controller.signal);
    controller.abort();
    throw new DOMException("Cancelled", "AbortError");
  });
  await assert.rejects(runDecomposition("mars_jezero_crater", "ridge", controller.signal),
    { name: "AbortError" });
});

test("API errors preserve server translation keys and parameters", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    detail: { error_key: "errors.site_not_found", params: { site_id: "missing" } },
  }, { status: 404 }));
  await assert.rejects(fetchPlanetarySites(), (error: unknown) =>
    error instanceof ApiClientError && error.errorKey === "errors.site_not_found" &&
    error.params.site_id === "missing");
});

test("planetary probes send the active estimated-data penalty and manual weights", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    assert.equal(body.penalize_estimated, true);
    assert.equal(body.test_profile, "manual_custom");
    assert.deepEqual(body.custom_iv_weights, { slope_deg: 1 });
    return Response.json({});
  });
  await probePlanetaryLocation({ body: "moon", lat: 10, lon: 20, modelType: "ridge",
    testProfile: "manual_custom", minSInd: 0.2, minSDep: 0, excludeBenchmarks: false,
    penalizeEstimated: true, limit: 10, customIvWeights: { slope_deg: 1 } });
});

test("compareCellWithSite and probeEarthCoordinate pass profile, penalty, and manual weights", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (!init?.method) {
      const parsed = new URL(url, "http://localhost");
      assert.equal(parsed.searchParams.get("model_type"), "ridge");
      assert.equal(parsed.searchParams.get("test_profile"), "manual_custom");
      assert.equal(parsed.searchParams.get("penalize_estimated"), "true");
      assert.equal(parsed.searchParams.get("iv_weights"), JSON.stringify({ slope_deg: 1 }));
      assert.equal(parsed.searchParams.get("dv_weights"), JSON.stringify({ mean_surface_temp_k: 1 }));
      return Response.json({});
    }
    const body = JSON.parse(init.body as string);
    assert.equal(body.test_profile, "manual_custom");
    assert.equal(body.penalize_estimated, true);
    assert.deepEqual(body.custom_iv_weights, { slope_deg: 1 });
    assert.deepEqual(body.custom_dv_weights, { mean_surface_temp_k: 1 });
    return Response.json({});
  });

  await compareCellWithSite("82b227fffffffff", "mars_jezero_crater", "ridge", {
    testProfile: "manual_custom",
    penalizeEstimated: true,
    customIvWeights: { slope_deg: 1 },
    customDvWeights: { mean_surface_temp_k: 1 },
  });

  await probeEarthCoordinate(-24.1, -69.9, "mars_jezero_crater", "ridge", {
    testProfile: "manual_custom",
    penalizeEstimated: true,
    customIvWeights: { slope_deg: 1 },
    customDvWeights: { mean_surface_temp_k: 1 },
  });
});
