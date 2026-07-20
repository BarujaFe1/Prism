/**
 * Connector registry — separates reliable (personal sync) from experimental scrapers.
 */
import { fetchRemoteOk } from "@/connectors/remoteok";
import { fetchWeWorkRemotely } from "@/connectors/weworkremotely";
import { fetchGreenhouse } from "@/connectors/greenhouse";
import { fetchLever } from "@/connectors/lever";
import { fetchRemotive } from "@/connectors/remotive";
import { fetchHackerNews } from "@/connectors/hackernews";
import { fetchArbeitnow } from "@/connectors/arbeitnow";
import { fetchJobicy } from "@/connectors/jobicy";
import { fetchLinkedInRSS } from "@/connectors/linkedin-rss";
import { fetchWellfound } from "@/connectors/wellfound";
import { fetchRemoteCo } from "@/connectors/remote-co";
import { fetchGoogleJobs } from "@/connectors/google-jobs";
import { fetch4DayWeek } from "@/connectors/4dayweek";
import { fetchNodesk } from "@/connectors/nodesk";
import { fetchRevelo } from "@/connectors/revelo";
import { fetchHimalayas } from "@/connectors/himalayas";
import { fetchStackOverflow } from "@/connectors/stackoverflow";
import { fetchGupy } from "@/connectors/gupy";
import { fetchAshby } from "@/connectors/ashby";

export type ConnectorDef = {
  id: string;
  name: string;
  fetch: () => Promise<{ new: number; duplicate: number; total: number }>;
  /** Reliable public APIs/RSS suitable for personal daily sync */
  reliable: boolean;
  description: string;
};

export const ALL_CONNECTORS: ConnectorDef[] = [
  {
    id: "gupy",
    name: "Gupy",
    fetch: fetchGupy,
    reliable: true,
    description: "Career pages Gupy (empresas BR) — portal search API offline",
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    fetch: fetchGreenhouse,
    reliable: true,
    description: "Boards oficiais Greenhouse (empresas BR/tech)",
  },
  {
    id: "lever",
    name: "Lever",
    fetch: fetchLever,
    reliable: true,
    description: "Boards oficiais Lever",
  },
  {
    id: "ashby",
    name: "Ashby",
    fetch: fetchAshby,
    reliable: true,
    description: "Boards oficiais Ashby",
  },
  {
    id: "remoteok",
    name: "Remote OK",
    fetch: fetchRemoteOk,
    reliable: true,
    description: "API remota — TypeScript/React/Node/junior",
  },
  {
    id: "remotive",
    name: "Remotive",
    fetch: fetchRemotive,
    reliable: true,
    description: "API de vagas remotas",
  },
  {
    id: "weworkremotely",
    name: "We Work Remotely",
    fetch: fetchWeWorkRemotely,
    reliable: true,
    description: "RSS por categoria",
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    fetch: fetchArbeitnow,
    reliable: true,
    description: "API job board",
  },
  {
    id: "himalayas",
    name: "Himalayas",
    fetch: fetchHimalayas,
    reliable: true,
    description: "API remota",
  },
  {
    id: "jobicy",
    name: "Jobicy",
    fetch: fetchJobicy,
    reliable: true,
    description: "RSS remota",
  },
  {
    id: "nodesk",
    name: "Nodesk",
    fetch: fetchNodesk,
    reliable: true,
    description: "RSS remota",
  },
  {
    id: "remote-co",
    name: "Remote.co",
    fetch: fetchRemoteCo,
    reliable: true,
    description: "RSS remota",
  },
  {
    id: "4dayweek",
    name: "4 Day Week",
    fetch: fetch4DayWeek,
    reliable: true,
    description: "API 4-day week",
  },
  {
    id: "hackernews",
    name: "HackerNews",
    fetch: fetchHackerNews,
    reliable: true,
    description: "Who is hiring / Algolia",
  },
  {
    id: "revelo",
    name: "Revelo",
    fetch: fetchRevelo,
    reliable: false,
    description: "API não oficial — pode falhar",
  },
  {
    id: "linkedin_rss",
    name: "LinkedIn (scrape)",
    fetch: fetchLinkedInRSS,
    reliable: false,
    description: "Scrape frágil — use só se necessário",
  },
  {
    id: "wellfound",
    name: "Wellfound",
    fetch: fetchWellfound,
    reliable: false,
    description: "Scrape frágil",
  },
  {
    id: "google_jobs",
    name: "Google Jobs",
    fetch: fetchGoogleJobs,
    reliable: false,
    description: "Scrape frágil",
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow Jobs",
    fetch: fetchStackOverflow,
    reliable: false,
    description: "Produto descontinuado — frequentemente vazio",
  },
];

export const RELIABLE_CONNECTORS = ALL_CONNECTORS.filter((c) => c.reliable);
export const EXPERIMENTAL_CONNECTORS = ALL_CONNECTORS.filter((c) => !c.reliable);

export function getConnectors(mode: "all" | "reliable" | "experimental" = "all"): ConnectorDef[] {
  if (mode === "reliable") return RELIABLE_CONNECTORS;
  if (mode === "experimental") return EXPERIMENTAL_CONNECTORS;
  return ALL_CONNECTORS;
}
