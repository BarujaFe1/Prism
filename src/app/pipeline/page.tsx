import { Shell } from "@/components/layout/Shell";
import { PipelineClient } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  return (
    <Shell>
      <PipelineClient />
    </Shell>
  );
}
