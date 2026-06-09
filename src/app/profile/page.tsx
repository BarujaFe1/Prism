import { Shell } from "@/components/layout/Shell";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <Shell>
      <ProfileClient />
    </Shell>
  );
}
