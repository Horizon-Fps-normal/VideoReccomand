import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Series Scout experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Series Scout/);
  assert.match(html, /你的下一部美剧/);
  assert.match(html, /正在打开你的剧集清单/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site|react-loading-skeleton/i);
});

test("keeps local persistence and optional TMDB search in the product code", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /localStorage/);
  assert.match(source, /TMDB_KEY_STORAGE/);
  assert.match(source, /seasonRatings/);
  assert.match(source, /dismissedIds/);
  assert.match(source, /posterUrl/);
  assert.match(source, /api\.tvmaze\.com\/search\/shows/);
});
