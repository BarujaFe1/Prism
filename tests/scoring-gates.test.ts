import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScore } from "../src/engine/scorer";
import { detectJobRedFlags } from "../src/engine/red-flags";
import type { ProfileData } from "../src/types/index";

const juniorProfile: ProfileData = {
  name: "Demo",
  headline: "Junior full-stack",
  summary: "",
  skills: ["TypeScript", "React", "Next.js", "Node.js", "SQL", "Python"],
  desiredRoles: ["Full Stack", "Frontend", "Backend", "Estágio"],
  desiredSalaryMin: 3000,
  desiredSalaryMax: 9000,
  desiredCurrency: "BRL",
  desiredLocationTypes: ["remote", "hybrid"],
  desiredContractTypes: ["clt", "pj", "internship"],
  experienceLevel: "junior",
  languages: ["pt", "en"],
  negativeKeywords: ["sales", "marketing", "cobol", "sap"],
};

function scoreJob(
  partial: Partial<Parameters<typeof computeScore>[0]> & { title: string }
) {
  return computeScore(
    {
      description: partial.description ?? "TypeScript React Next.js Node.js SQL",
      technologies: partial.technologies ?? ["TypeScript", "React", "Next.js"],
      locationType: partial.locationType ?? "remote",
      contractType: partial.contractType ?? "clt",
      experienceLevel: partial.experienceLevel ?? "junior",
      salaryMin: partial.salaryMin ?? 5000,
      salaryMax: partial.salaryMax ?? 8000,
      currency: partial.currency ?? "BRL",
      postedAt: partial.postedAt ?? new Date().toISOString(),
      location: partial.location ?? "Remote",
      company: partial.company ?? "Acme",
      ...partial,
      title: partial.title,
    },
    juniorProfile
  );
}

describe("scoring hard gates and ranking", () => {
  it("ranks a junior remote TS match above a senior sales role", () => {
    const good = scoreJob({
      title: "Junior Full Stack Developer",
      experienceLevel: "junior",
      locationType: "remote",
      technologies: ["TypeScript", "React", "Next.js", "SQL"],
    });
    const bad = scoreJob({
      title: "Senior Sales Manager",
      description: "Outbound sales and marketing quota",
      technologies: [],
      experienceLevel: "senior",
      locationType: "onsite",
      location: "Manaus, AM",
    });
    assert.ok(good.score > bad.score);
  });

  it("suppresses or heavily caps incompatible sales/design domains", () => {
    const sales = scoreJob({
      title: "Account Executive / Sales Closer",
      description: "Cold calling and CRM hunting",
      technologies: [],
    });
    assert.ok(sales.score <= 0.55);
    const details = sales.details as { fitLabel?: string; scoreLabel?: string };
    assert.ok(details.fitLabel === "low" || details.scoreLabel);
  });

  it("keeps internship/junior remote roles actionable relative to lead architect roles", () => {
    const intern = scoreJob({
      title: "Estágio Full-Stack TypeScript",
      experienceLevel: "internship",
      contractType: "internship",
      technologies: ["TypeScript", "React", "SQL"],
    });
    const lead = scoreJob({
      title: "Staff Platform Architect",
      experienceLevel: "lead",
      description: "Kubernetes Kafka multi-region ownership 12+ years",
      technologies: ["Kubernetes", "Kafka", "Go"],
      locationType: "onsite",
      location: "New York, NY",
      salaryMin: 200000,
      salaryMax: 300000,
      currency: "USD",
    });
    assert.ok(intern.score >= lead.score);
  });

  it("returns bounded score in [0, 1]", () => {
    const result = scoreJob({ title: "React Developer" });
    assert.ok(result.score >= 0 && result.score <= 1);
  });

  it("exposes explanation fields in details", () => {
    const result = scoreJob({ title: "Junior React Engineer" });
    const d = result.details as Record<string, unknown>;
    assert.ok("fitLabel" in d || "scoreLabel" in d || "explanation" in d);
  });
});

describe("red flags context", () => {
  it("flags rockstar/ninja language", () => {
    const flags = detectJobRedFlags({
      title: "Rockstar Ninja Engineer",
      description: "We need a wizard who codes 80h/week unpaid trial",
      company: "Toxic Co",
      location: "Remote",
      locationType: "remote",
      contractType: "clt",
      experienceLevel: "junior",
      salaryMin: null,
      salaryMax: null,
      currency: "BRL",
      salaryPeriod: "monthly",
      technologies: ["TypeScript"],
    });
    assert.ok(flags.some((f) => f.type === "critical" || f.label.includes("cargo")));
  });

  it("does not flag clean junior descriptions as critical by default", () => {
    const flags = detectJobRedFlags({
      title: "Junior Frontend Developer",
      description: "Build accessible React UIs with TypeScript and code review mentorship.",
      company: "Good Co",
      location: "São Paulo, SP",
      locationType: "hybrid",
      contractType: "clt",
      experienceLevel: "junior",
      salaryMin: 5000,
      salaryMax: 7000,
      currency: "BRL",
      salaryPeriod: "monthly",
      technologies: ["React", "TypeScript"],
    });
    const critical = flags.filter((f) => f.type === "critical");
    assert.equal(critical.length, 0);
  });
});
