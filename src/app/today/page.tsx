import { Shell } from "@/components/layout/Shell";
import { TodayClient } from "./today-client";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  return (
    <Shell>
      <TodayClient />
    </Shell>
  );
}
