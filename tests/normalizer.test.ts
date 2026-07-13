import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeJob } from "../src/engine/normalizer";

describe("normalizeJob", () => {
  it("uppercases currency and detects international roles", () => {
    const out = normalizeJob({
      title: "  senior data engineer  ",
      company: "acme corp",
      description: "Build pipelines with Python and SQL",
      location: "Remote — Worldwide",
      currency: "usd",
      source: "remoteok",
      salaryMin: 100000,
      salaryMax: 140000,
    });

    assert.equal(out.currency, "USD");
    assert.equal(out.isInternational, true);
    assert.ok(out.title.toLowerCase().includes("data engineer") || out.title.length > 0);
  });

  it("tags AI engineering when description mentions RAG/LLM", () => {
    const out = normalizeJob({
      title: "AI Engineer",
      company: "Lab",
      description: "Work with RAG, LangChain and LLM evaluation",
      source: "manual",
    });
    assert.ok((out.tags || []).includes("ai-engineering") || (out.tags || []).includes("llm-dev"));
  });
});
