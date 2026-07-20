import { Shell } from "@/components/layout/Shell";
import { EvidenceClient } from "./evidence-client";

export const dynamic = "force-dynamic";

export default function EvidencePage() {
  return (
    <Shell>
      <EvidenceClient />
    </Shell>
  );
}
