import type { PlanetaryBody } from "../../types/analog";

export type FunFactTag = PlanetaryBody | "atacama";

export interface FunFact {
  id: string;
  emoji: string;
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
  { id: "sound", emoji: "🔊", tag: "mars", source: "Perseverance SuperCam mic (Maurice et al., Nature 2022)" },
  { id: "sol", emoji: "🕰️", tag: "mars", source: "NASA Mars Fact Sheet" },
  { id: "comms", emoji: "📡", tag: "mars", source: "NASA JPL / Deep Space Network" },
  { id: "radiation", emoji: "☢️", tag: "mars", source: "Curiosity RAD (Hassler et al., Science 2014)" },
  { id: "olympus", emoji: "🏔️", tag: "mars", source: "NASA / MOLA topography" },
  { id: "temperature", emoji: "🌡️", tag: "mars", source: "Curiosity REMS · Perseverance MEDA" },
  { id: "blueSunset", emoji: "🌅", tag: "mars", source: "Curiosity Mastcam (2015)" },
  { id: "phobos", emoji: "🌑", tag: "mars", source: "NASA Phobos overview" },
  { id: "dustStorm", emoji: "🌪️", tag: "mars", source: "NASA Opportunity mission (2018)" },
  { id: "moonTemp", emoji: "🌗", tag: "moon", source: "LRO Diviner · NASA Moon Fact Sheet" },
  { id: "moonFootprints", emoji: "👣", tag: "moon", source: "NASA Apollo / Moon overview" },
  { id: "moonDay", emoji: "☀️", tag: "moon", source: "NASA Moon Fact Sheet" },
  { id: "atacamaRovers", emoji: "🤖", tag: "atacama", source: "NASA ARADS project (Atacama)" },
  { id: "perchlorate", emoji: "🧂", tag: "atacama", source: "Phoenix WCL (Hecht et al., Science 2009)" },
];

/** Puts facts relevant to the selected body first, keeping Atacama facts visible for local context. */
export function sortFunFactsForBody(body: PlanetaryBody): FunFact[] {
  const rank = (f: FunFact) => (f.tag === body ? 0 : f.tag === "atacama" ? 1 : 2);
  return [...FUN_FACTS].sort((a, b) => rank(a) - rank(b));
}
