import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Form workout experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Form — Workout tracking, without the fuss<\/title>/i);
  assert.match(html, />Today</);
  assert.match(html, /YOUR TRAINING/);
  assert.match(html, />Program</);
  assert.match(html, /Progress/);
  assert.match(html, /Settings/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps persistence versioned and product metadata branded", async () => {
  const [storage, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(storage, /gym-app-data-v1/);
  assert.match(storage, /isGymAppData/);
  assert.match(page, /<GymApp \/>/);
  assert.match(layout, /Form — Workout tracking, without the fuss/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
});
