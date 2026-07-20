import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCoverageHeatmap,
  classifySkillCoverage,
} from "../src/lib/career/evidence-coverage";
import {
  buildDailyActions,
  clampWipWarning,
  computeWip,
  selectTopOpportunities,
} from "../src/lib/focus/daily-actions";
import { DEFAULT_CAREER_TRACKS } from "../src/lib/career/default-tracks";

describe("evidence coverage heatmap", () => {
  it("does not mark TypeScript as real_gap when evidence exists", () => {
    const heatmap = buildCoverageHeatmap({
      profileSkills: ["TypeScript", "React"],
      evidences: [
        {
          associatedSkills: ["TypeScript", "React", "Next.js"],
          confidence: "high",
          projectUrl: "https://github.com/BarujaFe1/Prism",
          metrics: "99.6% TypeScript",
          approvedResumeBullet: "Construí o Prism…",
        },
      ],
      jobTechCounts: { TypeScript: 5, Cobol: 3 },
    });
    assert.ok(heatmap.strong.some((r) => r.skill === "TypeScript"));
    assert.ok(!heatmap.realGaps.some((r) => r.skill === "TypeScript"));
    assert.ok(heatmap.realGaps.some((r) => r.skill === "Cobol"));
  });

  it("labels profile skill without evidence as unregistered_evidence", () => {
    const row = classifySkillCoverage("Vitest", [], { onProfile: true, jobDemand: 1 });
    assert.equal(row.status, "unregistered_evidence");
  });
});

describe("career tracks seed", () => {
  it("treats Dev and Dados as equal primary verticals", () => {
    const dev = DEFAULT_CAREER_TRACKS.find((t) => t.key === "fullstack_product");
    const dados = DEFAULT_CAREER_TRACKS.find((t) => t.key === "data_analytics");
    assert.ok(dev);
    assert.ok(dados);
    assert.equal(dev!.priority, 1);
    assert.equal(dados!.priority, 1);
    assert.equal(dev!.weight, 1);
    assert.equal(dados!.weight, 1);
    assert.equal(dev!.active, true);
    assert.equal(dados!.active, true);
    assert.ok(dev!.label.toLowerCase().includes("dev"));
    assert.ok(dados!.label.toLowerCase().includes("dados"));
  });
});

describe("focus guard daily actions", () => {
  const baseJob = {
    id: "j1",
    title: "Estágio Full-Stack",
    company: "Orbita",
    status: "new",
    score: 0.82,
    scoreDetails: { eligibility: "eligible", domain: "fullstack_backend", vertical: "dev" },
    updatedAt: new Date().toISOString(),
  } as any;

  it("returns at most 3 actions", () => {
    const jobs = [1, 2, 3, 4].map((n) => ({
      ...baseJob,
      id: `j${n}`,
      score: 0.9 - n * 0.05,
    }));
    const actions = buildDailyActions({ jobs, learningTitle: "CI no Prism" });
    assert.ok(actions.length <= 3);
  });

  it("selects top opportunities above score floor", () => {
    const tops = selectTopOpportunities(
      [
        baseJob,
        { ...baseJob, id: "low", score: 0.2 },
        { ...baseJob, id: "senior", score: 0.9, scoreDetails: { eligibility: "over_senior" } },
      ],
      3
    );
    assert.equal(tops.length, 1);
    assert.equal(tops[0].id, "j1");
  });

  it("diversifies Dev and Dados in top opportunities", () => {
    const jobs = [
      {
        ...baseJob,
        id: "dev1",
        score: 0.95,
        scoreDetails: { eligibility: "eligible", domain: "fullstack_backend", vertical: "dev" },
      },
      {
        ...baseJob,
        id: "dev2",
        score: 0.94,
        title: "Software Engineer Jr",
        scoreDetails: { eligibility: "eligible", domain: "software_engineering", vertical: "dev" },
      },
      {
        ...baseJob,
        id: "dados1",
        score: 0.9,
        title: "Analista de Dados Jr",
        scoreDetails: { eligibility: "eligible", domain: "data", vertical: "dados" },
      },
    ];
    const tops = selectTopOpportunities(jobs, 3);
    const ids = tops.map((j) => j.id);
    assert.ok(ids.includes("dev1"));
    assert.ok(ids.includes("dados1"));
  });

  it("warns when WIP exceeds limits", () => {
    const wip = computeWip({ preparingCount: 8, learningTodoCount: 3 });
    assert.equal(wip.preparingOver, true);
    assert.equal(wip.learningOver, true);
    assert.ok(clampWipWarning(wip)?.includes("WIP"));
  });
});
