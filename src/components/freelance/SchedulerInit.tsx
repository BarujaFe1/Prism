"use client";

import { useEffect } from "react";

export function FreelanceSchedulerInit() {
  useEffect(() => {
    fetch("/api/freelance/scheduler/start", { method: "POST" }).catch(() => {});
    return () => {
      navigator.sendBeacon("/api/freelance/scheduler/stop", "");
    };
  }, []);

  return null;
}
