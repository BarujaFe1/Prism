"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function FreelanceBadge() {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["freelance-badge"],
    queryFn: async () => {
      const res = await fetch("/api/freelance/sync");
      const d = await res.json();
      return { windows: d.opportunityWindows || 0, total: d.totalProjects || 0 };
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    const link = document.querySelector('[data-freelance-badge]');
    if (link && data) {
      const count = data.windows > 0 ? data.windows : data.total > 0 ? data.total : 0;
      link.setAttribute("data-count", String(count));
      link.classList.toggle("has-count", count > 0);
    }
  }, [data]);

  return null;
}
