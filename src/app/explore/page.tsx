import { Shell } from "@/components/layout/Shell";
import { ExploreClient } from "./explore-client";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  return (
    <Shell>
      <ExploreClient />
    </Shell>
  );
}
