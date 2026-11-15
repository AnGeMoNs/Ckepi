import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import { formatNumber } from "../../i18n";
import { getPlanetMarkerColors } from "../../theme/mapColors";
import type {
  PlanetaryBody,
  PlanetaryOverlayLayer,
  PlanetarySite,
  ThemeMode,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { MAP_OPTION_FIELD, MapCardHeading, MapLegendItem, MapOptionsMenu, MapZoomControls } from "./MapCardParts";

interface PlanetaryMapProps {
  body: PlanetaryBody;
  sites: PlanetarySite[];
  theme?: ThemeMode;
  activeTarget: { lat: number; lon: number; label: string } | null;
  probingPlanetCoords: { lat: number; lon: number } | null;
  onSelectBody: (body: PlanetaryBody) => void;
  onSelectSite: (siteId: string) => void;
  onProbePlanet: (body: PlanetaryBody, lat: number, lon: number) => void;
}

const SPHERE_RADIUS = 1.0;

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const u = (lon + 180) / 360;
  const phi = u * 2 * Math.PI;
  const theta = (90 - lat) * (Math.PI / 180);
  const x = -radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function vector3ToLatLon(point: THREE.Vector3): { lat: number; lon: number } {
  const n = point.clone().normalize();
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, n.y))) * (180 / Math.PI);
  let phi = Math.atan2(n.z, -n.x);
  if (phi < 0) phi += 2 * Math.PI;
  const lon = (phi / (2 * Math.PI)) * 360 - 180;
  return { lat, lon };
}

export function PlanetaryMap({
  body,
  sites,
  theme = "dark",
  activeTarget,
  probingPlanetCoords,
  onSelectBody,
  onSelectSite,
  onProbePlanet,
}: PlanetaryMapProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const focusGoalRef = useRef<THREE.Vector3 | null>(null);

  const bodyRef = useRef(body);
  const onSelectSiteRef = useRef(onSelectSite);
  const onProbeRef = useRef(onProbePlanet);
  bodyRef.current = body;
  onSelectSiteRef.current = onSelectSite;
  onProbeRef.current = onProbePlanet;

  const [textureLoading, setTextureLoading] = useState(true);
  const [layer, setLayer] = useState<PlanetaryOverlayLayer>(
    body === "moon" ? "moon_wac" : "mars_color"
  );

  // Reset default optical layer when switching between Moon and Mars
  useEffect(() => {
    setLayer(body === "moon" ? "moon_wac" : "mars_color");
  }, [body]);

  // Initialize Three.js WebGL 3D Globe once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 2.75);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.45);
    dirLight.position.set(4, 3, 5);
    scene.add(dirLight);

    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 48);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereMeshRef.current = sphere;

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.28;
    controls.maxDistance = 4.6;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.85;
    controlsRef.current = controls;

    const handleControlsStart = () => {
      focusGoalRef.current = null;
    };
    controls.addEventListener("start", handleControlsStart);

    // Click vs drag raycasting
    const raycaster = new THREE.Raycaster();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      // Check marker pins first
      if (markersGroupRef.current) {
        const markerHits = raycaster.intersectObjects(markersGroupRef.current.children, false);
        const siteId = markerHits[0]?.object?.userData?.siteId;
        if (typeof siteId === "string" && siteId.length > 0) {
          onSelectSiteRef.current(siteId);
          return;
        }
      }

      // Otherwise intersect planetary sphere for arbitrary (lat, lon) probing
      const hits = raycaster.intersectObject(sphere, false);
      if (hits.length > 0) {
        const { lat, lon } = vector3ToLatLon(hits[0].point);
        onProbeRef.current(bodyRef.current, lat, lon);
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const goalDir = focusGoalRef.current;
      if (goalDir) {
        const dist = camera.position.length() || 2.6;
        const currentDir = camera.position.clone().normalize();
        if (currentDir.distanceTo(goalDir) < 0.015) {
          camera.position.copy(goalDir).multiplyScalar(dist);
          focusGoalRef.current = null;
        } else {
          if (currentDir.dot(goalDir) < -0.98) {
            currentDir.x += 0.05;
            currentDir.normalize();
          }
          currentDir.lerp(goalDir, 0.08).normalize().multiplyScalar(dist);
          camera.position.copy(currentDir);
        }
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(() => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.removeEventListener("start", handleControlsStart);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      sphereMeshRef.current = null;
      markersGroupRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // Load full equirectangular NASA Trek global texture when body or layer switches
  useEffect(() => {
    const sphere = sphereMeshRef.current;
    if (!sphere) return;
    if (body === "moon" && !layer.startsWith("moon_")) return;
    if (body === "mars" && !layer.startsWith("mars_")) return;

    setTextureLoading(true);
    const loader = new THREE.TextureLoader();
    loader.load(
      `/api/v1/textures/planet/${body}/${layer}.jpg`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const mat = sphere.material as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        mat.map = texture;
        mat.needsUpdate = true;
        setTextureLoading(false);
      },
      undefined,
      () => {
        setTextureLoading(false);
      }
    );
  }, [body, layer]);

  // Sync 3D markers on sphere & smoothly orient camera toward activeTarget
  useEffect(() => {
    const group = markersGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      group.remove(child);
    }

    const markerColors = getPlanetMarkerColors(theme);
    const bodySites = sites.filter((s) => s.body === body);
    for (const s of bodySites) {
      const isActive =
        activeTarget &&
        Math.abs(activeTarget.lat - s.coordinates.lat) < 0.05 &&
        Math.abs(activeTarget.lon - s.coordinates.lon) < 0.05;
      const pos = latLonToVector3(s.coordinates.lat, s.coordinates.lon, SPHERE_RADIUS * 1.015);
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(isActive ? 0.032 : 0.022, 16, 16),
        new THREE.MeshBasicMaterial({
          color: isActive ? markerColors.activeTarget : markerColors.trackedZone,
        })
      );
      pin.position.copy(pos);
      pin.userData = { siteId: s.site_id };
      group.add(pin);

      // Coverage halo marking tracked high-confidence zone
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.048, 0.088, 32),
        new THREE.MeshBasicMaterial({
          color: markerColors.trackedZone,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isActive ? 0.8 : 0.45,
        })
      );
      halo.position.copy(
        latLonToVector3(s.coordinates.lat, s.coordinates.lon, SPHERE_RADIUS * 1.008)
      );
      halo.lookAt(pos.clone().multiplyScalar(2));
      halo.userData = { siteId: s.site_id };
      group.add(halo);
    }

    if (
      activeTarget &&
      !bodySites.some(
        (s) =>
          Math.abs(activeTarget.lat - s.coordinates.lat) < 0.05 &&
          Math.abs(activeTarget.lon - s.coordinates.lon) < 0.05
      )
    ) {
      const customPin = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 16, 16),
        new THREE.MeshBasicMaterial({ color: markerColors.estimatedProbe })
      );
      customPin.position.copy(
        latLonToVector3(activeTarget.lat, activeTarget.lon, SPHERE_RADIUS * 1.018)
      );
      group.add(customPin);
    }

    focusGoalRef.current = activeTarget
      ? latLonToVector3(activeTarget.lat, activeTarget.lon, 1.0).normalize()
      : null;
  }, [sites, body, activeTarget, theme]);

  const handleZoom = (factor: number) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const dir = cam.position.clone().sub(ctrl.target);
    const nextDist = Math.max(ctrl.minDistance, Math.min(ctrl.maxDistance, dir.length() * factor));
    dir.setLength(nextDist);
    cam.position.copy(ctrl.target).add(dir);
    ctrl.update();
  };

  const handleFocusTarget = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    focusGoalRef.current = null;
    const dist = cam.position.length() || 2.6;
    if (activeTarget) {
      const dir = latLonToVector3(activeTarget.lat, activeTarget.lon, dist);
      cam.position.copy(dir);
    } else {
      cam.position.set(0, 0.4, 2.75);
    }
    ctrl.update();
  };

  return (
    <Card variant="liquid" className="map-panel !rounded-[2rem]">
      <MapCardHeading art={`/img/planets/ckepi-planet-${body}.webp`} title={t("explore.maps.globeTitle")} subtitle={t("explore.maps.globeSubtitle")}>
        <MapOptionsMenu>
          <label className="flex flex-col gap-1 text-xs font-semibold text-content-muted">
            {t("explore.maps.layer")}
            <select
              value={layer}
              onChange={(e) => setLayer(e.target.value as PlanetaryOverlayLayer)}
              className={MAP_OPTION_FIELD}
            >
              {body === "moon" ? (
                <>
                  <option value="moon_wac">{t("planetaryMap.layers.moon_wac")}</option>
                  <option value="moon_lola">{t("planetaryMap.layers.moon_lola")}</option>
                </>
              ) : (
                <>
                  <option value="mars_color">{t("planetaryMap.layers.mars_color")}</option>
                  <option value="mars_mola">{t("planetaryMap.layers.mars_mola")}</option>
                </>
              )}
            </select>
          </label>
          <div role="group" aria-label={t("explore.maps.world")} className="grid grid-cols-2 gap-2">
            {(["moon", "mars"] as PlanetaryBody[]).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={body === b}
                onClick={() => onSelectBody(b)}
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  body === b ? "border-accent/60 bg-accent/15 text-content" : "border-border-subtle bg-surface text-content-muted hover:text-content"
                }`}
              >
                {t(`bodies.${b}`)}
              </button>
            ))}
          </div>
        </MapOptionsMenu>
      </MapCardHeading>

      <CardContent className="space-y-3">
        <div className="relative h-[22rem] w-full overflow-hidden rounded-3xl border border-border-subtle/60 bg-ckepi-space sm:h-[30rem]">
          <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

          <MapZoomControls onZoomIn={() => handleZoom(0.78)} onZoomOut={() => handleZoom(1.28)} onReset={handleFocusTarget} />

          {(textureLoading || probingPlanetCoords) && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded border border-accent bg-surface-elevated/95 px-3 py-1.5 text-xs font-medium text-content">
              <Pictogram name="observe" className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none text-accent" />
              {probingPlanetCoords
                ? t("planetaryMap.probingTarget", {
                    body: t(`bodies.${body}`),
                    lat: formatNumber(probingPlanetCoords.lat, lang, 2),
                    lon: formatNumber(probingPlanetCoords.lon, lang, 2),
                  })
                : t("planetaryMap.loadingGlobe")}
            </div>
          )}
        </div>

        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 text-sm text-content-muted">
          <div className="flex flex-wrap items-center gap-4">
            <MapLegendItem dotClass="border-2 border-status-valid bg-status-valid/30">{t("planetaryMap.legendTracked")}</MapLegendItem>
            <MapLegendItem dotClass="bg-status-warn">{t("planetaryMap.legendEstimated")}</MapLegendItem>
          </div>
          {activeTarget && (
            <Badge variant="accent">
              {activeTarget.label} ({formatNumber(activeTarget.lat, lang, 2)},{" "}
              {formatNumber(activeTarget.lon, lang, 2)})
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
