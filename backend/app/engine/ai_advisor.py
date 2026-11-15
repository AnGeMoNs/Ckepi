"""OpenRouter LLM mission viability & operational considerations engine grounded in Ckepi physics."""

from datetime import datetime, timedelta, timezone
import hashlib
import json
import logging
import re
from typing import Any
import duckdb
import httpx

from app.config import settings
from app.etl.http_utils import create_async_http_client
from app.models.schemas import (
    DecompositionResponse,
    DistanceMetricType,
    MissionAiAnalysisRequest,
    MissionAiAnalysisResponse,
    MissionAiStructuredPayload,
    MultiAgencyCatalogResponse,
    SiteComparisonResponse,
)

logger = logging.getLogger("ckepi.ai_advisor")

AI_CACHE_SCHEMA_VERSION = "v1"

_VARIABLE_LABELS: dict[str, tuple[str, str]] = {
    "topographic_roughness": ("Topographic Roughness", "0-1 index"),
    "slope_deg": ("Mean Terrain Slope", "deg"),
    "thermal_inertia": ("Thermal Inertia", "TIU"),
    "surface_albedo": ("Surface Albedo", "0-1"),
    "solar_flux_wm2": ("Incident Solar Flux", "W/m^2"),
    "subsurface_ice_frac": ("Subsurface Ice Fraction", "fraction"),
    "aridity_index": ("Hyper-Aridity Index", "0-1"),
    "relative_humidity_pct": ("Relative Humidity", "%"),
    "uv_irradiance_index": ("UV Irradiance Index", "UV index"),
    "vegetation_lai_proxy": ("Vegetation Cover (LAI)", "m^2/m^2"),
    "diurnal_temp_amplitude_k": ("Diurnal Temp Amplitude (Delta T)", "K"),
    "nocturnal_cooling_k_hr": ("Nocturnal Cooling Rate", "K/hr"),
    "mean_surface_temp_k": ("Mean Surface Temperature", "K"),
    "surface_wind_ms": ("Surface Wind Speed", "m/s"),
    "aeolian_dust_flux": ("Aeolian Dust Flux", "0-1 index"),
    "ice_sublimation_rate": ("Ice Sublimation Rate", "0-1 index"),
    "gravity_g": ("Surface Gravity", "g"),
    "atm_pressure_mbar": ("Atmospheric Pressure", "mbar"),
    "radiation_msv_yr": ("Ionizing Radiation (GCR)", "mSv/yr"),
}

_SITE_LABELS: dict[str, str] = {
    "sites.moon_shackleton_pole.name": "Lunar South Pole — Shackleton Crater",
    "sites.moon_tranquillitatis_lava.name": "Mare Tranquillitatis — Lava Tube Skylight",
    "sites.mars_jezero_crater.name": "Mars — Jezero Crater (Lacustrine Delta)",
    "sites.mars_gale_crater.name": "Mars — Gale Crater (Aeolis Mons)",
    "sites.mars_arcadia_planitia.name": "Mars — Arcadia Planitia (Shallow Ice)",
    "sites.custom_moon": "Selected Lunar Coordinate",
    "sites.custom_mars": "Selected Martian Coordinate",
}

_LOCALE_NAMES: dict[str, str] = {
    "es": "Spanish (Español)",
    "pt": "Portuguese (Português)",
    "en": "English",
}

_OPENROUTER_JSON_SCHEMA: dict[str, Any] = {
    "name": "ckepi_mission_viability",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "executive_synthesis": {"type": "string"},
            "viability_assessment": {"type": "string"},
            "confidence_and_scale_note": {"type": "string"},
            "key_strengths": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "detail": {"type": "string"},
                        "related_variables": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["title", "detail", "related_variables"],
                    "additionalProperties": False,
                },
            },
            "physical_limitations_and_gaps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "detail": {"type": "string"},
                        "related_variables": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["title", "detail", "related_variables"],
                    "additionalProperties": False,
                },
            },
            "breakage_mitigation_plan": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "variable": {"type": "string"},
                        "earth_gap_impact": {"type": "string"},
                        "recommended_facility_or_protocol": {"type": "string"},
                    },
                    "required": [
                        "variable",
                        "earth_gap_impact",
                        "recommended_facility_or_protocol",
                    ],
                    "additionalProperties": False,
                },
            },
            "field_campaign_considerations": {
                "type": "array",
                "items": {"type": "string"},
            },
            "recommended_next_steps": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": [
            "executive_synthesis",
            "viability_assessment",
            "confidence_and_scale_note",
            "key_strengths",
            "physical_limitations_and_gaps",
            "breakage_mitigation_plan",
            "field_campaign_considerations",
            "recommended_next_steps",
        ],
        "additionalProperties": False,
    },
}


class AiAdvisorError(Exception):
    """Structured domain error raised during OpenRouter invocation or parsing."""

    def __init__(self, status_code: int, error_key: str, detail: str = "") -> None:
        super().__init__(detail or error_key)
        self.status_code = status_code
        self.error_key = error_key
        self.detail = detail


def _humanize_key(key: str) -> str:
    """Convert an i18n dot-key into a readable English fallback label."""
    tail = key.split(".")[-1]
    return tail.replace("_", " ").strip().title()


def build_grounded_context(
    comparison: SiteComparisonResponse,
    decomposition: DecompositionResponse,
    test_profile: str,
    distance_metric: DistanceMetricType,
    reading_mode: str,
    locale: str,
    catalog_context: MultiAgencyCatalogResponse | None = None,
) -> dict[str, Any]:
    """Assemble a strictly factual JSON context from Ckepi's deterministic physics engine."""
    site = comparison.site
    match = comparison.match
    recs = match.engineering_recommendations

    deltas_payload = []
    for d in comparison.variable_deltas:
        label, unit = _VARIABLE_LABELS.get(d.variable, (_humanize_key(d.variable), ""))
        deltas_payload.append(
            {
                "variable": d.variable,
                "label": label,
                "unit": unit,
                "layer": d.layer,
                "planetary_value": round(d.planetary_value, 4),
                "earth_value": round(d.earth_value, 4),
                "similarity_score": round(d.similarity_score, 4),
                "weight": round(d.weight, 4),
                "is_breakage": d.is_breakage,
            }
        )

    xy_deltas = [d for d in deltas_payload if d["layer"] in ("independent", "dependent")]
    xy_sorted_desc = sorted(xy_deltas, key=lambda x: float(x["similarity_score"]), reverse=True)
    xy_sorted_asc = sorted(xy_deltas, key=lambda x: float(x["similarity_score"]))

    broken = [
        {
            "variable": b.variable,
            "label": _VARIABLE_LABELS.get(b.variable, (_humanize_key(b.variable), ""))[0],
            "unit": _VARIABLE_LABELS.get(b.variable, ("", ""))[1],
            "planetary_value": round(b.planetary_value, 4),
            "earth_baseline_value": round(b.earth_baseline_value, 4),
            "breakage_index": round(b.breakage_index, 4),
        }
        for b in match.breakage_alerts
        if b.is_broken
    ]

    top_weights = sorted(
        (
            {
                "variable": k,
                "label": _VARIABLE_LABELS.get(k, (_humanize_key(k), ""))[0],
                "weight": round(v, 4),
            }
            for k, v in decomposition.global_iv_weights.items()
            if v > 0.01
        ),
        key=lambda item: float(item["weight"]),
        reverse=True,
    )[:6]

    enrichment: dict[str, Any] | None = None
    if catalog_context is not None:
        enrichment = {
            "geology": (
                catalog_context.geology.model_dump()
                if catalog_context.geology is not None
                else None
            ),
            "subsurface": (
                {
                    "has_lava_tubes_or_caves": catalog_context.subsurface.has_lava_tubes_or_caves,
                    "nearest_feature": catalog_context.subsurface.nearest_feature,
                    "feature_type": catalog_context.subsurface.feature_type,
                }
                if catalog_context.subsurface is not None
                else None
            ),
            "habitability": (
                {
                    "habitability_index": catalog_context.habitability.habitability_index,
                    "regime": _humanize_key(catalog_context.habitability.regime_key),
                    "extremophiles": catalog_context.habitability.extremophiles,
                }
                if catalog_context.habitability is not None
                else None
            ),
            "regolith_simulant": (
                {
                    "recommended_code": catalog_context.regolith_simulant.recommended_code,
                    "affinity_score": catalog_context.regolith_simulant.affinity_score,
                    "isru_o2_index": catalog_context.regolith_simulant.isru_o2_index,
                    "astrobiology_purity_index": catalog_context.regolith_simulant.astrobiology_purity_index,
                    "sand_pct": catalog_context.regolith_simulant.sand_pct,
                    "silt_pct": catalog_context.regolith_simulant.silt_pct,
                    "clay_pct": catalog_context.regolith_simulant.clay_pct,
                    "bulk_density_g_cm3": catalog_context.regolith_simulant.bulk_density_g_cm3,
                    "organic_carbon_pct": catalog_context.regolith_simulant.organic_carbon_pct,
                }
                if catalog_context.regolith_simulant is not None
                else None
            ),
            "agency_datasets_available": len(catalog_context.products),
        }

    return {
        "target_locale": locale,
        "reading_mode": reading_mode,
        "test_profile": test_profile,
        "distance_metric": distance_metric,
        "planetary_target": {
            "site_id": site.site_id,
            "body": site.body,
            "label": _SITE_LABELS.get(site.name_key, _humanize_key(site.name_key)),
            "coordinates": site.coordinates.model_dump(),
            "iau_feature": site.planetary_feature.model_dump() if site.planetary_feature else None,
            "data_sources": site.data_sources,
            "confidence": (
                {
                    "level": site.confidence.level,
                    "score": round(site.confidence.score, 4),
                    "is_tracked_zone": site.confidence.is_tracked_zone,
                    "real_variables": site.confidence.real_variables,
                    "estimated_variables": site.confidence.estimated_variables,
                }
                if site.confidence
                else None
            ),
        },
        "earth_analog_cell": {
            "earth_cell_h3": match.earth_cell_h3,
            "h3_resolution": match.h3_resolution,
            "effective_scale_km": match.effective_scale_km,
            "coordinates": match.coordinates.model_dump(),
            "country_code": match.country_code,
            "region": _humanize_key(match.region_key),
            "biome": _humanize_key(match.biome_key),
            "known_analog_name": match.known_analog_name,
            "is_benchmark": match.is_benchmark,
            "is_pareto_optimal": match.is_pareto_optimal,
            "source_apis": match.provenance.source_apis,
            "observation_window": match.provenance.observation_window,
            "is_live_probed": match.provenance.is_live_probed,
        },
        "scores_and_verdict": {
            "viability_tier": recs.viability_tier,
            "s_ind": round(match.s_ind, 4),
            "s_dep": round(match.s_dep, 4),
            "combined_score": round(match.combined_score, 4),
            "confidence_adjusted_score": round(match.confidence_adjusted_score, 4),
            "score_uncertainty": round(match.score_uncertainty, 4),
            "confidence_interval": list(match.confidence_interval),
            "r_break_overall": round(match.r_break_overall, 4),
            "valid_tests": [_humanize_key(k) for k in recs.valid_tests],
            "invalid_tests": [_humanize_key(k) for k in recs.invalid_tests],
        },
        "causal_decomposition": {
            "model_type": decomposition.model_type,
            "sample_count": decomposition.sample_count,
            "top_global_iv_weights": top_weights,
            "dependent_models": [
                {
                    "dv_name": m.dv_name,
                    "r2_score": round(m.r2_score, 4),
                    "cv_r2_score": round(m.cv_r2_score, 4),
                    "is_available": m.is_available,
                }
                for m in decomposition.dependent_models
            ],
            "unavailable_dvs": decomposition.unavailable_dvs,
        },
        "strongest_matching_variables": xy_sorted_desc[:4],
        "weakest_matching_variables": xy_sorted_asc[:4],
        "broken_physical_boundaries": broken,
        "all_variable_deltas": deltas_payload,
        "geology_and_isru_enrichment": enrichment,
    }


def compute_analysis_cache_key(
    payload: MissionAiAnalysisRequest,
    comparison: SiteComparisonResponse,
) -> str:
    """Compute a deterministic SHA-256 cache key matching exact site, cell, config, and metrics."""
    match = comparison.match
    fingerprint = {
        "v": AI_CACHE_SCHEMA_VERSION,
        "site_id": payload.site_id,
        "earth_cell_h3": payload.earth_cell_h3,
        "model_type": payload.model_type,
        "distance_metric": payload.distance_metric,
        "test_profile": payload.test_profile,
        "penalize_estimated": payload.penalize_estimated,
        "reading_mode": payload.reading_mode,
        "locale": payload.locale,
        "custom_iv_weights": payload.custom_iv_weights or {},
        "custom_dv_weights": payload.custom_dv_weights or {},
        "custom_min_similarity": payload.custom_min_similarity or {},
        "configured_model": settings.openrouter_model,
        "scores": {
            "s_ind": round(match.s_ind, 4),
            "s_dep": round(match.s_dep, 4),
            "combined": round(match.combined_score, 4),
            "uncertainty": round(match.score_uncertainty, 4),
            "r_break": round(match.r_break_overall, 4),
            "h3_res": match.h3_resolution,
        },
    }
    encoded = json.dumps(fingerprint, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def ensure_ai_cache_table(duckdb_path: str) -> None:
    """Create the persistent AI analysis cache table in DuckDB if absent."""
    conn = duckdb.connect(duckdb_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS mission_ai_analyses (
                cache_key VARCHAR PRIMARY KEY,
                site_id VARCHAR,
                earth_cell_h3 VARCHAR,
                locale VARCHAR,
                reading_mode VARCHAR,
                test_profile VARCHAR,
                model_used VARCHAR,
                created_at VARCHAR,
                payload_json VARCHAR
            )
            """
        )
    finally:
        conn.close()


def get_cached_ai_analysis(
    duckdb_path: str,
    cache_key: str,
    ttl_hours: int,
) -> MissionAiAnalysisResponse | None:
    """Return a non-expired cached MissionAiAnalysisResponse from DuckDB if present."""
    conn = duckdb.connect(duckdb_path, read_only=True)
    try:
        row = conn.execute(
            "SELECT created_at, payload_json FROM mission_ai_analyses WHERE cache_key = ?",
            [cache_key],
        ).fetchone()
    except duckdb.CatalogException:
        return None
    finally:
        conn.close()

    if row is None:
        return None

    created_raw, payload_json = str(row[0]), str(row[1])
    try:
        created_dt = datetime.fromisoformat(created_raw)
        if created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - created_dt > timedelta(hours=max(1, ttl_hours)):
            return None
        parsed = MissionAiAnalysisResponse.model_validate_json(payload_json)
        return parsed.model_copy(update={"cached": True})
    except Exception:
        return None


def upsert_cached_ai_analysis(
    duckdb_path: str,
    cache_key: str,
    response: MissionAiAnalysisResponse,
) -> None:
    """Persist an OpenRouter analysis in DuckDB using parameterized queries."""
    ensure_ai_cache_table(duckdb_path)
    conn = duckdb.connect(duckdb_path)
    try:
        conn.execute("DELETE FROM mission_ai_analyses WHERE cache_key = ?", [cache_key])
        conn.execute(
            """
            INSERT INTO mission_ai_analyses (
                cache_key, site_id, earth_cell_h3, locale, reading_mode,
                test_profile, model_used, created_at, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                cache_key,
                response.site_id,
                response.earth_cell_h3,
                response.locale,
                response.reading_mode,
                response.test_profile,
                response.model_used,
                response.generated_at,
                response.model_dump_json(),
            ],
        )
    finally:
        conn.close()


def _build_system_prompt(locale: str, reading_mode: str) -> str:
    language_name = _LOCALE_NAMES.get(locale, "Spanish (Español)")
    tone_instruction = (
        "Write in rigorous planetary engineering and astrobiology field-campaign terminology suitable for mission planners."
        if reading_mode == "mission"
        else "Write in clear, engaging STEAM educational language without jargon overload, while preserving exact scientific facts."
    )
    return (
        "You are Ckepi's Planetary Analog Mission Viability Analyst. "
        f"Respond strictly in {language_name}. {tone_instruction} "
        "Base EVERY claim, percentage, uncertainty, scale, coordinate, variable delta, and source exclusively on the JSON telemetry packet provided by the user. "
        "Do NOT invent unprovided numerical readings, local infrastructure, or flight certifications. "
        "Explain: (1) why the analog achieves its S_ind, S_dep, and combined score and where discrepancies occur, "
        "(2) how the empirical uncertainty (+/-) and H3 cell spatial scale (~km) affect field-test representativeness, "
        "(3) what engineering mitigations (hypobaric CO2 chambers, vacuum chambers, active gravity offload, radiation/SEE beam testing) are required for each broken physical boundary (B), "
        "and (4) practical field campaign considerations and next steps inside Ckepi (such as H3 sub-cell refinement or multi-agency satellite checks). "
        "Always treat the output as scientific pre-selection for field trials, never operational safety certification. "
        "Return ONLY valid JSON matching the requested schema."
    )


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    """Extract and parse a JSON object from LLM text (stripping optional reasoning or code fences)."""
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, flags=re.DOTALL)
    candidate = fence_match.group(1) if fence_match else cleaned

    try:
        loaded = json.loads(candidate)
        if isinstance(loaded, dict):
            return loaded
    except json.JSONDecodeError:
        pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end > start:
        loaded = json.loads(candidate[start : end + 1])
        if isinstance(loaded, dict):
            return loaded

    raise ValueError("No valid JSON object found in OpenRouter completion content")


def _extract_message_content(response_json: dict[str, Any]) -> str:
    """Safely extract text content from an OpenAI/OpenRouter chat completion payload."""
    choices = response_json.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("OpenRouter response missing choices")
    first = choices[0]
    if not isinstance(first, dict):
        raise ValueError("OpenRouter choice entry is not an object")
    message = first.get("message")
    if not isinstance(message, dict):
        raise ValueError("OpenRouter choice missing message")
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [
            str(part.get("text", ""))
            for part in content
            if isinstance(part, dict) and part.get("type") in ("text", "output_text")
        ]
        joined = "\n".join(p for p in parts if p)
        if joined:
            return joined
    raise ValueError("OpenRouter message content is empty or unsupported")


async def request_openrouter_analysis(
    payload: MissionAiAnalysisRequest,
    comparison: SiteComparisonResponse,
    decomposition: DecompositionResponse,
    http_client: httpx.AsyncClient | None = None,
) -> MissionAiAnalysisResponse:
    """Invoke OpenRouter chat completions with structured output & graceful format fallbacks."""
    api_key = (settings.openrouter_api_key or "").strip()
    if not api_key:
        raise AiAdvisorError(503, "errors.ai_not_configured", "OPENROUTER_API_KEY is not configured")

    grounded_context = build_grounded_context(
        comparison=comparison,
        decomposition=decomposition,
        test_profile=payload.test_profile,
        distance_metric=payload.distance_metric,
        reading_mode=payload.reading_mode,
        locale=payload.locale,
        catalog_context=payload.catalog_context,
    )

    endpoint = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_app_name,
    }

    base_body: dict[str, Any] = {
        "model": settings.openrouter_model,
        "temperature": 0.2,
        "max_tokens": 1400,
        "messages": [
            {
                "role": "system",
                "content": _build_system_prompt(payload.locale, payload.reading_mode),
            },
            {
                "role": "user",
                "content": (
                    "Analyze this deterministic Ckepi planetary-analog telemetry packet and return "
                    "the structured JSON mission viability & operational considerations report:\n"
                    + json.dumps(grounded_context, ensure_ascii=False)
                ),
            },
        ],
    }
    if settings.openrouter_fallback_models:
        chain = [settings.openrouter_model] + [
            m for m in settings.openrouter_fallback_models if m != settings.openrouter_model
        ]
        base_body["models"] = chain

    format_attempts: list[dict[str, Any] | None] = [
        {"type": "json_schema", "json_schema": _OPENROUTER_JSON_SCHEMA},
        {"type": "json_object"},
        None,
    ]

    async def _run_with_client(client: httpx.AsyncClient) -> tuple[dict[str, Any], str]:
        last_status = 502
        last_detail = ""
        for idx, response_fmt in enumerate(format_attempts):
            req_body = dict(base_body)
            if response_fmt is not None:
                req_body["response_format"] = response_fmt
            try:
                resp = await client.post(
                    endpoint,
                    headers=headers,
                    json=req_body,
                    timeout=settings.openrouter_timeout_seconds,
                )
            except httpx.TimeoutException as exc:
                raise AiAdvisorError(
                    504, "errors.ai_provider_unavailable", "OpenRouter request timed out"
                ) from exc
            except httpx.HTTPError as exc:
                raise AiAdvisorError(
                    502, "errors.ai_provider_unavailable", "OpenRouter network failure"
                ) from exc

            if resp.status_code == 429:
                raise AiAdvisorError(429, "errors.ai_rate_limited", "OpenRouter rate limit reached")
            if resp.status_code in (401, 403):
                raise AiAdvisorError(
                    502, "errors.ai_provider_unavailable", f"OpenRouter auth error ({resp.status_code})"
                )
            if resp.status_code in (400, 422) and idx < len(format_attempts) - 1:
                last_status = resp.status_code
                last_detail = resp.text[:300]
                logger.info(
                    "OpenRouter rejected response_format=%s (HTTP %s); retrying with fallback format",
                    response_fmt.get("type") if response_fmt else "none",
                    resp.status_code,
                )
                continue
            if resp.status_code >= 400:
                last_status = resp.status_code
                last_detail = resp.text[:300]
                raise AiAdvisorError(
                    502,
                    "errors.ai_provider_unavailable",
                    f"OpenRouter HTTP {last_status}: {last_detail}",
                )

            data = resp.json()
            if not isinstance(data, dict):
                raise AiAdvisorError(502, "errors.ai_invalid_response", "OpenRouter payload not an object")
            model_used = str(data.get("model") or settings.openrouter_model)
            return data, model_used

        raise AiAdvisorError(
            502,
            "errors.ai_provider_unavailable",
            f"OpenRouter HTTP {last_status}: {last_detail}",
        )

    if http_client is not None:
        raw_resp, model_used = await _run_with_client(http_client)
    else:
        async with create_async_http_client(timeout=settings.openrouter_timeout_seconds) as client:
            raw_resp, model_used = await _run_with_client(client)

    try:
        raw_text = _extract_message_content(raw_resp)
        raw_obj = _extract_json_object(raw_text)
        structured = MissionAiStructuredPayload.model_validate(raw_obj)
    except Exception as exc:
        logger.warning("Failed to parse OpenRouter structured response: %s", exc)
        raise AiAdvisorError(
            502, "errors.ai_invalid_response", "Invalid structured payload from OpenRouter"
        ) from exc

    return MissionAiAnalysisResponse(
        **structured.model_dump(),
        site_id=payload.site_id,
        earth_cell_h3=payload.earth_cell_h3,
        locale=payload.locale,
        reading_mode=payload.reading_mode,
        test_profile=payload.test_profile,
        model_used=model_used,
        provider="openrouter",
        cached=False,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
