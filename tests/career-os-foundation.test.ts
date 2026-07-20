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
  it("includes Full-Stack as priority 1 and active", () => {
    const primary = DEFAULT_CAREER_TRACKS.find((t) => t.key === "fullstack_product");
    assert.ok(primary);
    assert.equal(primary!.priority, 1);
    assert.equal(primary!.active, true);
    assert.ok(DEFAULT_CAREER_TRACKS.length >= 6);
  });
});

describe("focus guard daily actions", () => {
  const baseJob = {
    id: "j1",
    title: "Estágio Full-Stack",
    company: "Orbita",
    status: "new",
    score: 0.82,
    scoreDetails: { eligibility: "eligible" },
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

  it("warns when WIP exceeds limits", () => {
    const wip = computeWip({ preparingCount: 8, learningTodoCount: 3 });
    assert.equal(wip.preparingOver, true);
    assert.equal(wip.learningOver, true);
    assert.ok(clampWipWarning(wip)?.includes("WIP"));
  });
});
