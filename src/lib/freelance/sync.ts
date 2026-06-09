import { fetchUpworkRSS } from "./connectors/upwork-rss";
import { fetchContra } from "./connectors/contra";
import { fetchMalt } from "./connectors/malt-scraper";
import { fetchWWRContract } from "./connectors/wwr-contract";
import { fetchFreelancerRSS } from "./connectors/freelancer-rss";
import { fetchPPH } from "./connectors/pph-rss";
import { fetchRemoteOKContract } from "./connectors/remoteok-contract";
import { fetchSimplyHired } from "./connectors/simplyhired";

type ConnectorFn = () => Promise<{ new: number; duplicate: number }>;

interface ConnectorDef {
  id: string;
  name: string;
  fetch: ConnectorFn;
}

const connectors: ConnectorDef[] = [
  { id: "upwork", name: "Upwork RSS", fetch: fetchUpworkRSS },
  { id: "contra", name: "Contra", fetch: fetchContra },
  { id: "malt", name: "Malt", fetch: fetchMalt },
  { id: "wwr-contract", name: "WWR Contract", fetch: fetchWWRContract },
  { id: "freelancer", name: "Freelancer.com RSS", fetch: fetchFreelancerRSS },
  { id: "peopleperhour", name: "PeoplePerHour RSS", fetch: fetchPPH },
  { id: "remoteok-contract", name: "RemoteOK Contract", fetch: fetchRemoteOKContract },
  { id: "simplyhired", name: "SimplyHired", fetch: fetchSimplyHired },
];

export async function syncAllFreelanceSources(
  filterId?: string
): Promise<{ results: Record<string, { new: number; duplicate: number }>; errors: string[] }> {
  const results: Record<string, { new: number; duplicate: number }> = {};
  const errors: string[] = [];

  const toRun = filterId ? connectors.filter((c) => c.id === filterId) : connectors;

  for (const c of toRun) {
    try {
      results[c.id] = await c.fetch();
    } catch (err: any) {
      errors.push(`${c.name}: ${err.message}`);
      results[c.id] = { new: 0, duplicate: 0 };
    }
  }

  return { results, errors };
}

export { connectors as freelanceConnectors };
