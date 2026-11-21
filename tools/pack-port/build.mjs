import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  access, copyFile, cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

export const BASELINE = "b4d049c03dc9e05c75526a8ba1e50610e8adf6e5";
export const PACKS = [
  {
    path: "actors/blaupause-spielfiguren", type: "Actor", count: 3,
    sha: "5e2f3af2eea310c65caba0637d5ccf3a0c12886cf5b09e972c96cc5954020747",
  },
  {
    path: "rolltables/tabellen-kritische-ereignisse", type: "RollTable", count: 5,
    sha: "4880b04bb7602e1ced731ad325556ca6b924d4a9d60a036d80f9fd9280c510ed",
  },
  {
    path: "macros/makros-kritische-ereignisse", type: "Macro", count: 5,
    sha: "e9e7e6e07fe7b3433e189981d792a37a302fc20ad2166e9fb1b0055e3923bf16",
  },
  {
    path: "macros/makros-standardwurfel", type: "Macro", count: 4,
    sha: "421fe49c6455982bef16becbe56093d91bfc6ed05941a5b2a48f08c1a843e5c6",
  },
  {
    path: "scenes/scenes-midgard-karten", type: "Scene", count: 3,
    sha: "b0e3c87bd4c7383bb1a3054429e069f75bb89e4eafa2a297fb1cfc94cd30d176",
  },
].map(Object.freeze);
Object.freeze(PACKS);
export const DEFAULT_REPO = fileURLToPath(new URL("../../", import.meta.url));

function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
const empty = v => v == null || (Array.isArray(v) && v.length === 0);
const sorted = docs => [...docs].sort((a, b) => a._id < b._id ? -1 : +(a._id > b._id));

export function criticalMacro(tableId) {
  assert.match(tableId, /^[a-zA-Z0-9]{16}$/);
  return [
    'const pack = game.packs.get("midgard5.tabellen-kritische-ereignisse");',
    'const table = await pack?.getDocument(' + JSON.stringify(tableId) + ');',
    'if (!table) {',
    '  ui.notifications.error("Die kritische Tabelle fehlt im MIDGARD-5-Kompendium.");',
    '  return;',
    '}',
    'await table.draw();',
  ].join("\n");
}

function actor(old, doc) {
  assert.ok(["character", "npc"].includes(old.type), "Unexpected Actor type");
  assert.ok(empty(old.items) && empty(old.effects), "Embedded actor contents need individual migration");
  const t = old.token;
  assert.equal(t.actorId, old._id);
  assert.equal(t.brightSight, 0, "Non-default legacy vision is outside this baseline");
  assert.equal(t.dimSight, 0, "Non-default legacy vision is outside this baseline");
  assert.equal(t.brightLight, 0, "Non-default legacy light is outside this baseline");
  assert.equal(t.dimLight, 0, "Non-default legacy light is outside this baseline");
  const src = t.randomImg ? { src: t.img } : { src: t.img, scaleX: t.scale, scaleY: t.scale };
  const texture = { ...src, scaleX: t.scale * (t.mirrorX ? -1 : 1), scaleY: t.scale * (t.mirrorY ? -1 : 1), tint: t.tint || null };
  return {
    ...doc, type: old.type, system: old.data, items: [], effects: [], sort: old.sort,
    prototypeToken: {
      name: t.name, actorLink: t.actorLink, displayName: t.displayName, displayBars: t.displayBars,
      disposition: t.disposition, bar1: t.bar1, bar2: t.bar2, flags: t.flags,
      width: t.width, height: t.height, rotation: t.rotation, lockRotation: t.lockRotation,
      randomImg: t.randomImg, texture, sight: { enabled: t.vision, angle: t.sightAngle },
    },
  };
}

function table(old, doc) {
  return {
    ...doc, description: tableNotes(old.description), formula: old.formula,
    replacement: old.replacement, displayRoll: old.displayRoll,
    results: old.results.map((r) => {
      assert.equal(r.type, 0, "Only legacy textual results are expected");
      assert.ok(!r.resultId && !r.collection, "Unexpected document reference");
      return {
        _id: r._id, _key: r._key, flags: r.flags, type: "text", ...resultText(r.text, r.range), drawn: r.drawn,
        range: r.range, weight: r.weight, img: r.img,
      };
    }),
  };
}

// In the V14 sheet/chat card the document already has a title. Keep the
// legacy printed table title as compact bold text, and render notes as prose.
function tableNotes(html) {
  return html.replace(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => {
    if (level === "2") return "<p><strong>" + inner + "</strong></p>";
    return "<p>" + inner.replace(/<\/?br\s*\/?>/gi, "</p><p>") + "</p>";
  });
}

function plainHeading(html) {
  const entities = { amp: "&", lt: "<", gt: ">", nbsp: " ", quot: '"', apos: "'" };
  return html.replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|nbsp|quot|apos);/g, (_, entity) => entities[entity])
    .replace(/\s+/g, " ").trim();
}

function resultText(html, [low, high]) {
  const fallback = low === high ? `Ergebnis ${low}` : `Ergebnis ${low} bis ${high}`;
  // This one baseline entry contains an accidentally run-together heading
  // and paragraph. The literal seam preserves every source character.
  const joined = /^<h3>kurzer Schock(Das Opfer[^<]+)<\/h3>$/.exec(html);
  if (joined) return { name: "kurzer Schock", description: "<p>" + joined[1] + "</p>" };
  const heading = /^\s*<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i.exec(html);
  if (!heading) return { name: fallback, description: html };

  const title = plainHeading(heading[2]);
  const body = html.slice(heading[0].length);
  // Long or rich headings are still part of the legacy prose; keep them in
  // the description if they cannot safely be represented as a short title.
  const richHeading = /<(?!(?:\/?b)\s*>)[^>]+>|\[\[|@(?:UUID|Embed)\[/i.test(heading[2]);
  if (!title || title.length > 100 || richHeading) {
    return { name: fallback, description: "<p>" + heading[2] + "</p>" + body };
  }

  // A legacy sentence has its final period just after </h3>. Move the
  // punctuation with the heading rather than leaving it orphaned in prose.
  const punctuation = /^[.?!](?=\s|$)/.exec(body)?.[0] ?? "";
  return { name: title + punctuation, description: body.slice(punctuation.length).trimStart() };
}

function scene(old, doc) {
  for (const key of ["tiles", "tokens", "walls", "lights", "sounds", "templates", "notes", "drawings"]) {
    assert.ok(empty(old[key]), "Unexpected embedded legacy Scene contents: " + key);
  }
  const level = sha("midgard5:scene:level:" + old._id).slice(0, 16);
  return {
    ...doc, description: old.description, active: old.active, navigation: old.navigation,
    navName: old.navName, navOrder: old.navOrder, initial: old.initial, thumb: old.thumb,
    width: old.width, height: old.height, padding: old.padding,
    shiftX: old.shiftX, shiftY: old.shiftY, backgroundColor: old.backgroundColor,
    grid: {
      type: old.gridType, size: old.grid, color: old.gridColor, alpha: old.gridAlpha,
      distance: old.gridDistance, units: old.gridUnits,
    },
    tokenVision: old.tokenVision, fog: { mode: old.fogExploration ? 1 : 0, reset: old.fogReset ?? null },
    environment: {
      darknessLevel: old.darkness,
      globalLight: { enabled: old.globalLight, darkness: { min: 0, max: old.globalLightThreshold ?? 1 } },
    },
    initialLevel: level,
    levels: [{
      _id: level, _key: "!scenes.levels!" + old._id + "." + level, name: old.name,
      background: { src: old.img, color: Number.parseInt(old.backgroundColor.slice(1), 16) },
    }],
    playlist: old.playlist || null, journal: old.journal || null, weather: old.weather || null,
  };
}

export function transformPack(def, source, tables) {
  const byName = new Map(tables.map(t => [t.name, t]));
  return sorted(source).map((old) => {
    const doc = { _id: old._id, _key: old._key, name: old.name, flags: old.flags, ownership: old.permission };
    if (def.type !== "Scene") doc.img = old.img;
    switch (def.type) {
      case "Actor": return actor(old, doc);
      case "RollTable": return table(old, doc);
      case "Scene": return scene(old, doc);
      case "Macro": {
        assert.ok(empty(old.actorIds) && old.scope === "global", "Unexpected scoped legacy Macro");
        const crit = def.path === "macros/makros-kritische-ereignisse";
        const target = byName.get(old.name);
        assert.equal(old.type, crit ? "script" : "chat");
        if (crit) assert.ok(target, "Critical table missing: " + old.name);
        return { ...doc, type: old.type, scope: old.scope, author: null, command: crit ? criticalMacro(target._id) : old.command };
      }
      default: throw new Error("Unsupported pack type: " + def.type);
    }
  });
}

async function readDocs(dir) {
  const names = (await readdir(dir)).filter(n => n.endsWith(".json")).sort();
  return sorted(await Promise.all(names.map(async n => JSON.parse(await readFile(join(dir, n), "utf8")))));
}

async function ensureAbsent(path) {
  try { await lstat(path); }
  catch (e) { if (e.code === "ENOENT") return; throw e; }
  throw new Error("Refusing to overwrite existing path: " + path);
}

export async function loadLegacy(repo, work) {
  const docs = new Map();
  for (const def of PACKS) {
    const original = join(repo, "packs", def.path + ".db");
    assert.equal(sha(await readFile(original)), def.sha, "Expected unchanged V0.07 input: " + def.path);
    // NeDB implementations can rewrite/compact their input on open. Use only a private temporary copy.
    const staged = join(work, "legacy", def.path + ".db");
    await mkdir(dirname(staged), { recursive: true });
    await copyFile(original, staged);
    const extracted = join(work, "source", def.path);
    await extractPack(staged, extracted, { nedb: true, documentType: def.type });
    const found = await readDocs(extracted);
    assert.equal(found.length, def.count, def.path);
    assert.equal(new Set(found.map(d => d._id)).size, def.count, "Duplicate document ID");
    assert.equal(sha(await readFile(original)), def.sha, "Original input was touched");
    docs.set(def.path, found);
  }
  return docs;
}

const normalized = value => {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort().map(([k,v]) => [k, normalized(v)]));
  }
  return value;
};

// The Foundry CLI fills null/empty registered embedded collections when loading the database.
function expectedRoundTrip(doc, type) {
  if (type !== "Scene") return doc;
  return {
    drawings: [], tokens: [], lights: [], notes: [], regions: [], sounds: [],
    templates: [], tiles: [], walls: [], ...doc,
  };
}

export async function verifyLevelDB(dbPath, workspace, docs, type) {
  // Opening LevelDB may create housekeeping files, so read a temporary copy for verification.
  const backup = join(workspace, "db-copy");
  await cp(dbPath, backup, { recursive: true });
  const output = join(workspace, "result");
  await extractPack(backup, output);
  const actual = await readDocs(output);
  assert.deepEqual(normalized(actual), normalized(docs.map(doc => expectedRoundTrip(doc, type))), "LevelDB roundtrip changed documents");
}

export async function buildPacks({
  repo = DEFAULT_REPO, output = join(repo, "packs"), packPaths = PACKS.map(def => def.path),
} = {}) {
  const selected = PACKS.filter(def => packPaths.includes(def.path));
  assert.ok(selected.length && selected.length === packPaths.length, "Unknown or duplicate pack selection");
  const work = await mkdtemp(join(tmpdir(), "midgard5-pack-port-"));
  let report;
  try {
    for (const def of selected) await ensureAbsent(join(output, def.path));
    const sources = await loadLegacy(repo, work);
    const tables = sources.get("rolltables/tabellen-kritische-ereignisse");
    report = [];
    for (const def of selected) {
      const docs = transformPack(def, sources.get(def.path), tables);
      if (def.type === "Scene") {
        for (const d of docs) {
          assert.ok(d.levels[0].background.src.startsWith("systems/midgard5/"));
          await access(join(repo, d.levels[0].background.src.slice("systems/midgard5/".length)));
        }
      }
      const input = join(work, "converted", def.path);
      await mkdir(input, { recursive: true });
      for (const doc of docs) await writeFile(join(input, doc._id + ".json"), JSON.stringify(doc, null, 2) + "\n");
      const target = join(work, "leveldb", def.path);
      await compilePack(input, target);
      await verifyLevelDB(target, join(work, "verify", def.path), docs, def.type);
      for (const name of ["LOCK", "LOG", "LOG.old"]) await rm(join(target, name), { force: true });
      report.push({ pack: def.path, type: def.type, documents: docs.length });
    }
    // The protected baseline inputs and other pre-existing packs must never be overwritten.
    for (const def of selected) {
      const dest = join(output, def.path);
      await ensureAbsent(dest);
      await mkdir(dirname(dest), { recursive: true });
      // cp allows an explicitly selected output on a different filesystem from the temp area.
      await cp(join(work, "leveldb", def.path), dest, { recursive: true, force: false, errorOnExist: true });
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }
  return report;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [repo = DEFAULT_REPO, output = join(repo, "packs"), ...others] = process.argv.slice(2);
  assert.equal(others.length, 0, "Usage: node build.mjs [repo-root] [output-packs-directory]");
  console.table(await buildPacks({ repo: resolve(repo), output: resolve(output) }));
}
