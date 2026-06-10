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

const connectors = [
  { id: "remoteok", name: "Remote OK", fetch: fetchRemoteOk },
  { id: "weworkremotely", name: "We Work Remotely", fetch: fetchWeWorkRemotely },
  { id: "greenhouse", name: "Greenhouse", fetch: fetchGreenhouse },
  { id: "lever", name: "Lever", fetch: fetchLever },
  { id: "remotive", name: "Remotive", fetch: fetchRemotive },
  { id: "hackernews", name: "HackerNews", fetch: fetchHackerNews },
  { id: "arbeitnow", name: "Arbeitnow", fetch: fetchArbeitnow },
  { id: "jobicy", name: "Jobicy", fetch: fetchJobicy },
  { id: "linkedin_rss", name: "LinkedIn RSS", fetch: fetchLinkedInRSS },
  { id: "wellfound", name: "Wellfound", fetch: fetchWellfound },
  { id: "remote-co", name: "Remote.co", fetch: fetchRemoteCo },
  { id: "google_jobs", name: "Google Jobs", fetch: fetchGoogleJobs },
  { id: "4dayweek", name: "4 Day Week", fetch: fetch4DayWeek },
  { id: "nodesk", name: "Nodesk", fetch: fetchNodesk },
  { id: "revelo", name: "Revelo", fetch: fetchRevelo },
  { id: "himalayas", name: "Himalayas", fetch: fetchHimalayas },
  { id: "stackoverflow", name: "Stack Overflow Jobs", fetch: fetchStackOverflow },
  { id: "gupy", name: "Gupy", fetch: fetchGupy },
];

async function main() {
  console.log("Starting full general data opportunities sync...");
  let totalNew = 0;
  let totalDup = 0;
  let totalFetched = 0;

  for (const connector of connectors) {
    try {
      console.log(`\nRunning connector: ${connector.name}...`);
      const result = await connector.fetch();
      console.log(` -> Success: Fetched ${result.total} (New: ${result.new}, Duplicate: ${result.duplicate})`);
      totalNew += result.new;
      totalDup += result.duplicate;
      totalFetched += result.total;
    } catch (err: any) {
      console.error(` -> Failed: ${err.message}`);
    }
    // Polite delay between connectors
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log("\n============================================");
  console.log("General Sync Completed!");
  console.log(`- Connectors Run: ${connectors.length}`);
  console.log(`- Total Opportunities Processed: ${totalFetched}`);
  console.log(`- Total New Added: ${totalNew}`);
  console.log(`- Total Duplicates Logged: ${totalDup}`);
  console.log("============================================");
}

main();
