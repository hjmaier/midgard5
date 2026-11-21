import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildPacks, criticalMacro, DEFAULT_REPO, loadLegacy, PACKS, transformPack } from "./build.mjs";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const tablePack = "rolltables/tabellen-kritische-ereignisse";
const visible = html => html.replace(/<[^>]*>/g, "").replaceAll("&lt;", "<").replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&").replace(/\s/g, "");
const dice = html => html.match(/\[\[.*?\]\]/g) ?? [];

test("critical macros await one table draw by stable ID and handle unavailable pack and table", async () => {
  const events = [];
  const game = { packs: new Map([["midgard5.tabellen-kritische-ereignisse", {
    async getDocument(id) {
      events.push(id);
      return id === "cQX6GAYWErokE8ks" ? { async draw() { events.push("drawn"); } } : undefined;
    },
  }]]) };
  const ui = { notifications: { error(msg) { assert.match(msg, /kritische Tabelle fehlt/i); events.push("missing"); } } };
  const success = new AsyncFunction("game", "ui", criticalMacro("cQX6GAYWErokE8ks"));
  const missing = new AsyncFunction("game", "ui", criticalMacro("JOQf46Cj29MwcKsY"));
  await success(game, ui);
  await missing(game, ui);
  await missing({ packs: new Map() }, ui);
  assert.deepEqual(events, ["cQX6GAYWErokE8ks", "drawn", "JOQf46Cj29MwcKsY", "missing", "missing"]);
});

test("exact V0.07 sources retain IDs, embedded content, art, and gameplay intent", async t => {
  const root = await mkdtemp(join(tmpdir(), "midgard5-pack-tests-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const docs = await loadLegacy(DEFAULT_REPO, root);
  assert.equal(docs.size, 5);
  const tables = docs.get("rolltables/tabellen-kritische-ereignisse");
  for (const def of PACKS) {
    const originals = docs.get(def.path);
    const migrated = transformPack(def, originals, tables);
    const pairs = migrated.map(d => [d, originals.find(o => o._id === d._id)]);
    assert.equal(migrated.length, def.count);
    for (const [d, o] of pairs) {
      assert.equal(d.name, o.name);
      assert.equal(d._key, o._key);
      assert.deepEqual(d.ownership, o.permission);
      assert.ok(!Object.hasOwn(d, "permission"));
      if (def.type === "Actor") {
        assert.deepEqual(d.system, o.data);
        assert.equal(d.prototypeToken.actorLink, o.token.actorLink);
        assert.equal(d.prototypeToken.texture.src, o.token.img);
        assert.deepEqual(d.prototypeToken.bar1, o.token.bar1);
        assert.deepEqual(d.prototypeToken.bar2, o.token.bar2);
      }
      if (def.type === "RollTable") {
        assert.equal(visible(d.description), visible(o.description));
        assert.deepEqual(dice(d.description), dice(o.description));
        assert.match(d.description, /^<p><strong>Tabelle /);
        assert.doesNotMatch(d.description, /<\/?h[1-6]\b|<\/br>/i);
        for (const key of ["formula", "replacement", "displayRoll", "img", "flags"]) {
          assert.deepEqual(d[key], o[key], key);
        }
        assert.equal(d.results.length, o.results.length);
        for (const [index, result] of d.results.entries()) {
          const legacy = o.results[index];
          assert.equal(result._id, legacy._id);
          assert.deepEqual(result.range, legacy.range);
          const visibleResult = (result.name.startsWith("Ergebnis ") ? "" : result.name.replace(/\s/g, "")) +
            visible(result.description);
          assert.equal(visibleResult, visible(legacy.text));
          assert.deepEqual(dice(result.description), dice(legacy.text));
          for (const key of ["weight", "drawn", "img", "flags"]) assert.deepEqual(result[key], legacy[key], key);
          assert.equal(result.type, "text");
        }
        const values = d.results.flatMap(({ range: [low, high] }) =>
          Array.from({ length: high - low + 1 }, (_, offset) => low + offset));
        assert.deepEqual(values.sort((a, b) => a - b), Array.from({ length: 100 }, (_, index) => index + 1));
      }
      if (def.type === "Scene") {
        assert.equal(d.levels[0]._id, d.initialLevel);
        assert.equal(d.levels[0].background.src, o.img);
        assert.equal(d.grid.distance, o.gridDistance);
        assert.equal(d.grid.units, o.gridUnits);
        assert.equal(d.thumb, o.thumb);
        assert.equal(d.playlist, o.playlist || null);
        assert.equal(d.journal, o.journal || null);
        assert.ok(["Myrkgard", "Midgard V1 (alte Farbkarte)", "Midgard V2 (neue Farbkarte)"].includes(d.name));
      }
      if (def.type === "Macro" && d.type === "chat") assert.equal(d.command, o.command);
      if (def.type === "Macro") {
        assert.equal(d.scope, o.scope);
        assert.equal(d.author, null);
      }
      if (def.type === "Macro" && d.type === "script") {
        const found = tables.find(tab => tab.name === d.name);
        assert.equal(d.command, criticalMacro(found._id));
      }
    }
  }
});

test("critical roll cards show compact notes and keep every result's prose without duplicate headings", async t => {
  const root = await mkdtemp(join(tmpdir(), "midgard5-table-layout-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const docs = await loadLegacy(DEFAULT_REPO, root);
  const tables = docs.get(tablePack);
  const converted = transformPack(PACKS.find(p => p.path === tablePack), tables, tables);
  const result = (name, roll) => converted.find(tab => tab.name === name)
    .results.find(r => r.range[0] <= roll && roll <= r.range[1]);

  const spell = "Kritische Fehler beim Zaubern";
  assert.match(converted.find(tab => tab.name === spell).description, /<p><b>\*<\/b>: Die Magie.*<\/p><p>Wird ein kritischer Fehler/s);
  assert.match(result(spell, 26).name, /^\* Der Zauberer verspricht sich/);
  assert.match(result(spell, 26).description, /^Es kommt zu einer Entladung/);
  assert.doesNotMatch(result(spell, 26).description, /verspricht sich/);
  assert.equal(result(spell, 10).name, "Ergebnis 1 bis 10");
  assert.equal(result(spell, 10).description, "Keine besonderen Auswirkungen.");
  assert.equal(result("Kritischer Fehler bei der Abwehr", 10).description, "");
  assert.equal(result("Kritischer Fehler bei der Abwehr", 45).name, "Ergebnis 41 bis 50");
  assert.match(result("Kritischer Fehler bei der Abwehr", 45).description, /^<p>Der Verteidiger.*Fernkampf\)\.<\/p>/);
  assert.equal(result("Kritischer Schaden", 12).name, "kurzer Schock");
  assert.match(result("Kritischer Schaden", 12).description, /^<p>Das Opfer /);
  assert.equal(result("Kritischer Schaden", 86).name, "Kopftreffer mit Hörschaden <++>");
  assert.match(result("Kritischer Fehler bei Angriffen", 100).name, /seine Waffe\.$/);
  assert.match(result("Kritischer Fehler bei Angriffen", 100).description, /^Bei einem Angriff/);
});

test("selective build produces only the corrected RollTable pack", async t => {
  const root = await mkdtemp(join(tmpdir(), "midgard5-table-integration-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = join(root, "packs");
  const summary = await buildPacks({ output, packPaths: [tablePack] });
  assert.deepEqual(summary, [{ pack: tablePack, type: "RollTable", documents: 5 }]);
  await access(join(output, tablePack, "CURRENT"));
  await assert.rejects(access(join(output, "macros")));
});

test("compile all five packs and verify LevelDB round trips without overwriting", async t => {
  const root = await mkdtemp(join(tmpdir(), "midgard5-pack-integration-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = join(root, "packs");
  const summary = await buildPacks({ output });
  assert.equal(summary.reduce((sum, p) => sum + p.documents, 0), 20);
  for (const {pack} of summary) await access(join(output, pack, "CURRENT"));
  await assert.rejects(buildPacks({ output }), /refusing to overwrite/i);
});
