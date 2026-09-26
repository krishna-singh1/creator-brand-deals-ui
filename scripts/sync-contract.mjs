#!/usr/bin/env node
// Copies the API contract (owned by the API repo, ADR 0009) into contracts/openapi.yaml.
// Source: CONTRACT_SOURCE (file path or https URL), else a sibling checkout of the API repo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "contracts/openapi.yaml");
const siblings = ["../creator-brand-deals", "../brand-deals"].map((d) =>
  resolve(root, d, "contracts/openapi.yaml"),
);

async function readSource() {
  const source = process.env.CONTRACT_SOURCE;
  if (source?.startsWith("http")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
    return { from: source, text: await res.text() };
  }
  const path = source ? resolve(root, source) : siblings.find(existsSync);
  if (!path || !existsSync(path)) {
    throw new Error(
      `Contract not found. Clone the API repo next to this one or set CONTRACT_SOURCE. Tried: ${source ?? siblings.join(", ")}`,
    );
  }
  return { from: path, text: readFileSync(path, "utf8") };
}

const { from, text } = await readSource();
if (!text.startsWith("openapi:")) throw new Error(`${from} does not look like an OpenAPI document`);
const previous = existsSync(target) ? readFileSync(target, "utf8") : "";
writeFileSync(target, text);
console.log(previous === text ? `Contract unchanged (${from})` : `Contract updated from ${from}`);
