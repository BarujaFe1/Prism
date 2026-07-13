import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_JOB_PATCH_FIELDS,
  ALLOWED_SETTINGS_FIELDS,
  clampInt,
  isDemoMode,
  parseCsvParam,
  sanitizePatch,
} from "../src/lib/api-guards";

describe("parseCsvParam", () => {
  it("splits and trims values", () => {
    assert.deepEqual(parseCsvParam("new, saved ,applied"), ["new", "saved", "applied"]);
  });

  it("returns empty for nullish input", () => {
    assert.deepEqual(parseCsvParam(null), []);
    assert.deepEqual(parseCsvParam(""), []);
  });
});

describe("clampInt", () => {
  it("clamps and falls back", () => {
    assert.equal(clampInt("10", 50, 1, 500), 10);
    assert.equal(clampInt("9999", 50, 1, 500), 500);
    assert.equal(clampInt("abc", 50, 1, 500), 50);
  });
});

describe("sanitizePatch", () => {
  it("keeps only allowlisted fields", () => {
    const result = sanitizePatch(
      { status: "applied", evil: "drop table", nextActionType: "follow_up" },
      ALLOWED_JOB_PATCH_FIELDS
    );
    assert.deepEqual(result, { status: "applied", nextActionType: "follow_up" });
  });

  it("blocks unknown settings fields", () => {
    const result = sanitizePatch(
      { syncFrequency: "12", id: "hacked", notificationsEnabled: false },
      ALLOWED_SETTINGS_FIELDS
    );
    assert.deepEqual(result, { syncFrequency: "12", notificationsEnabled: false });
  });
});

describe("isDemoMode", () => {
  it("reads PRISM_DEMO_MODE from env", () => {
    const prev = process.env.PRISM_DEMO_MODE;
    process.env.PRISM_DEMO_MODE = "1";
    assert.equal(isDemoMode(), true);
    process.env.PRISM_DEMO_MODE = "0";
    assert.equal(isDemoMode(), false);
    if (prev === undefined) delete process.env.PRISM_DEMO_MODE;
    else process.env.PRISM_DEMO_MODE = prev;
  });
});
