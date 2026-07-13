import { Shell } from "@/components/layout/Shell";
import { SourcesClient } from "./sources-client";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  return (
    <Shell>
      <SourcesClient />
    </Shell>
  );
}
