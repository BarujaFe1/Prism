import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScore, extractTechnologies } from "../src/engine/scorer";
import { detectJobRedFlags } from "../src/engine/red-flags";
import { findDuplicates } from "../src/engine/deduplicator";
import { formatSalary, statusLabel, timeAgo } from "../src/lib/utils";
import type { ProfileData } from "../src/types/index";

const baseProfile: ProfileData = {
  name: "Felipe",
  headline: "Data / Full-stack",
  summary: "",
  skills: ["TypeScript", "React", "Next.js", "Python", "SQL", "Pandas"],
  desiredRoles: ["Full Stack", "Data Analyst", "Data Science"],
  desiredSalaryMin: 8000,
  desiredSalaryMax: 20000,
  desiredCurrency: "BRL",
  desiredLocationTypes: ["remote", "hybrid"],
  desiredContractTypes: ["clt", "pj"],
  experienceLevel: "junior",
  languages: ["pt", "en"],
  negativeKeywords: ["sales", "marketing"],
};

describe("extractTechnologies", () => {
  it("finds known technologies in text", () => {
    const techs = extractTechnologies("We use React, TypeScript and PostgreSQL daily.");
    assert.ok(techs.includes("React"));
    assert.ok(techs.includes("TypeScript"));
    assert.ok(techs.includes("PostgreSQL"));
  });
});

describe("computeScore", () => {
  it("returns zero score without profile", () => {
    const result = computeScore(
      {
        title: "React Developer",
        description: "TypeScript React Next.js",
        technologies: ["React", "TypeScript"],
        locationType: "remote",
        contractType: "clt",
        experienceLevel: "junior",
        salaryMin: 10000,
        salaryMax: 15000,
        currency: "BRL",
        postedAt: new Date().toISOString(),
      },
      null
    );
    assert.equal(result.score, 0);
  });

  it("scores a strong junior remote match higher than a senior sales role", () => {
    const good = computeScore(
      {
        title: "Junior Full Stack Developer",
        description: "React TypeScript Next.js Node.js SQL",
        technologies: ["React", "TypeScript", "Next.js", "SQL"],
        locationType: "remote",
        contractType: "clt",
        experienceLevel: "junior",
        salaryMin: 9000,
        salaryMax: 14000,
        currency: "BRL",
        postedAt: new Date().toISOString(),
      },
      baseProfile
    );

    const bad = computeScore(
      {
        title: "Senior Sales Manager",
        description: "Closing deals and marketing campaigns",
        technologies: [],
        locationType: "onsite",
        contractType: "clt",
        experienceLevel: "senior",
        salaryMin: 20000,
        salaryMax: 30000,
        currency: "BRL",
        postedAt: new Date().toISOString(),
      },
      baseProfile
    );

    assert.ok(good.score > bad.score);
    assert.ok(good.score >= 0.4);
    assert.ok(bad.score < 0.2);
  });
});

describe("detectJobRedFlags", () => {
  it("flags rockstar language as critical", () => {
    const flags = detectJobRedFlags({
      title: "Rockstar Ninja Developer",
      description: "Looking for a superstar wizard",
      company: "Acme",
      location: "Remote",
      locationType: "remote",
      contractType: "pj",
      experienceLevel: "junior",
      salaryMin: null,
      salaryMax: null,
      currency: null,
      salaryPeriod: null,
      technologies: ["React", "Vue", "Angular", "Svelte", "Java", "Go", "Rust", "C++", "Kafka"],
    });

    assert.ok(flags.some((f) => f.label === "cargo_inflado"));
    assert.ok(flags.some((f) => f.label === "stack_excessiva_junior"));
  });
});

describe("findDuplicates", () => {
  it("groups near-identical jobs from different sources", () => {
    const groups = findDuplicates([
      {
        id: "1",
        title: "Frontend Engineer",
        company: "Linear",
        location: "Remote",
        source: "remoteok",
        sourceId: "a",
        url: "https://example.com/a",
        description: "React TypeScript design system",
        score: 0.8,
      },
      {
        id: "2",
        title: "Frontend Engineer",
        company: "Linear",
        location: "Remote",
        source: "weworkremotely",
        sourceId: "b",
        url: "https://example.com/b",
        description: "React TypeScript design system",
        score: 0.7,
      },
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].keep.id, "1");
    assert.equal(groups[0].duplicates.length, 1);
  });
});

describe("utils", () => {
  it("formats salary ranges in BRL", () => {
    const text = formatSalary(8000, 12000, "BRL", "monthly");
    assert.match(text, /8\.000/);
    assert.match(text, /12\.000/);
  });

  it("maps status labels", () => {
    assert.equal(statusLabel("applied"), "Aplicada");
    assert.equal(statusLabel("unknown_status"), "unknown_status");
  });

  it("formats relative time", () => {
    const today = timeAgo(new Date().toISOString());
    assert.equal(today, "hoje");
  });
});
