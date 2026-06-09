import { FreelanceSchedulerInit } from "@/components/freelance/SchedulerInit";

export default function FreelanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FreelanceSchedulerInit />
      {children}
    </>
  );
}
