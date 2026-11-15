import type { PlanetaryBody } from "../../types/analog";
import type { PictogramName } from "../worlds/Pictograms";

export type FunFactTag = PlanetaryBody | "atacama";

export interface FunFact {
  id: string;
  pictogram: PictogramName;
  tag: FunFactTag;
  /** Short, language-neutral reference so students can verify the claim. */
  source: string;
}

/**
 * Curated, verifiable planetary curiosities. Text lives in i18n under
 * `funFacts.items.<id>.q` (question) and `funFacts.items.<id>.a` (answer).
 * Values are rounded for students; sources point to the original references.
 */
export const FUN_FACTS: FunFact[] = [
  { id: "sound", pictogram: "listen", tag: "mars", source: "Perseverance SuperCam mic (Maurice et al., Nature 2022)" },
  { id: "sol", pictogram: "sun", tag: "mars", source: "NASA Mars Fact Sheet" },
  { id: "comms", pictogram: "share", tag: "mars", source: "NASA JPL / Deep Space Network" },
  { id: "radiation", pictogram: "radiation", tag: "mars", source: "Curiosity RAD (Hassler et al., Science 2014)" },
  { id: "olympus", pictogram: "terrain", tag: "mars", source: "NASA / MOLA topography" },
  { id: "temperature", pictogram: "temperature", tag: "mars", source: "Curiosity REMS · Perseverance MEDA" },
  { id: "blueSunset", pictogram: "sun", tag: "mars", source: "Curiosity Mastcam (2015)" },
  { id: "phobos", pictogram: "crescent", tag: "mars", source: "NASA Phobos overview" },
  { id: "dustStorm", pictogram: "pressure", tag: "mars", source: "NASA Opportunity mission (2018)" },
  { id: "moonTemp", pictogram: "thermalSwing", tag: "moon", source: "LRO Diviner · NASA Moon Fact Sheet" },
  { id: "moonFootprints", pictogram: "gravity", tag: "moon", source: "NASA Apollo / Moon overview" },
  { id: "moonDay", pictogram: "sun", tag: "moon", source: "NASA Moon Fact Sheet" },
  { id: "atacamaRovers", pictogram: "rover", tag: "atacama", source: "NASA ARADS project (Atacama)" },
  { id: "perchlorate", pictogram: "hexCell", tag: "atacama", source: "Phoenix WCL (Hecht et al., Science 2009)" },
];

/** Puts facts relevant to the selected body first, keeping Atacama facts visible for local context. */
export function sortFunFactsForBody(body: PlanetaryBody): FunFact[] {
  const rank = (f: FunFact) => (f.tag === body ? 0 : f.tag === "atacama" ? 1 : 2);
  return [...FUN_FACTS].sort((a, b) => rank(a) - rank(b));
}
