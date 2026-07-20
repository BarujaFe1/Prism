import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  domainToVertical,
  trackKeyToVertical,
  verticalDomainScore,
} from "../src/lib/career/verticals";
import { classifyDomain } from "../src/engine/scorer";

describe("career verticals", () => {
  it("maps domains to Dev vs Dados", () => {
    assert.equal(domainToVertical("fullstack_backend"), "dev");
    assert.equal(domainToVertical("frontend"), "dev");
    assert.equal(domainToVertical("software_engineering"), "dev");
    assert.equal(domainToVertical("data"), "dados");
    assert.equal(domainToVertical("estatistica"), "dados");
    assert.equal(domainToVertical("bi_analytics"), "dados");
    assert.equal(domainToVertical("sales"), "other");
  });

  it("gives equal domain score to both verticals", () => {
    assert.equal(verticalDomainScore("dev"), 1);
    assert.equal(verticalDomainScore("dados"), 1);
  });

  it("maps track keys to verticals", () => {
    assert.equal(trackKeyToVertical("fullstack_product"), "dev");
    assert.equal(trackKeyToVertical("frontend"), "dev");
    assert.equal(trackKeyToVertical("data_analytics"), "dados");
  });

  it("classifies analyst and stats titles as data domains", () => {
    assert.equal(classifyDomain("Analista de Dados Júnior"), "data");
    assert.equal(classifyDomain("Estágio em Estatística"), "estatistica");
    assert.equal(classifyDomain("Desenvolvedor Full-Stack Júnior"), "fullstack_backend");
  });
});
