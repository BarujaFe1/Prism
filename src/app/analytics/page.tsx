import { Shell } from "@/components/layout/Shell";
import { AnalyticsClient } from "./analytics-client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <Shell>
      <ErrorBoundary>
        <AnalyticsClient />
      </ErrorBoundary>
    </Shell>
  );
}
