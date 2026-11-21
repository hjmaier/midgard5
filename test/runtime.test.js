import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";
import { defaults } from "../module/data/defaults.js";
import { makeSchema } from "../module/data/models.js";

const manifest = JSON.parse(await readFile(new URL("../system.json", import.meta.url)));
const init = new Map(), on = new Map(), registered = [];
class TypeDataModel { static migrateData(data) { return data; } }
class Sheet { async _prepareContext() { return { core: true }; } }
class NumberField { constructor(options) { this.options = options; } }
class SchemaField { constructor(fields) { this.fields = fields; } }
class BooleanField extends NumberField {}
class StringField extends NumberField {}
class ObjectField extends NumberField {}
class HTMLField extends StringField {}
class FilePicker {}
globalThis.Hooks = { once: (name, fn) => init.set(name, fn), on: (name, fn) => on.set(name, fn) };
globalThis.foundry = { abstract: { TypeDataModel }, data: { fields: {
  NumberField, SchemaField, BooleanField, StringField, ObjectField, HTMLField
} }, applications: {
  api: { HandlebarsApplicationMixin: Base => class extends Base {} },
  ux: { TextEditor: { enrichHTML: async (value, options) => {
    assert.ok(options.relativeTo); return value;
  } } },
  sheets: { ActorSheetV2: Sheet, ItemSheetV2: Sheet },
  apps: { FilePicker, DocumentSheetConfig: { registerSheet: (...args) => registered.push(args) } }
} };
globalThis.CONFIG = { Actor: { documentClass: "Actor", dataModels: {} },
  Item: { documentClass: "Item", dataModels: {} } };
globalThis.game = { i18n: { localize: label => label } };
await import("../midgard5.js");
init.get("init")();

test("manifest, field schemas and default sheet registrations agree", () => {
  assert.equal(manifest.id, "midgard5");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.initiative, "@gw.value + @gw.bonus");
  assert.deepEqual([manifest.primaryTokenAttribute, manifest.secondaryTokenAttribute], ["lp", "ap"]);
  for (const kind of ["Actor", "Item"]) {
    const expected = Object.keys(manifest.documentTypes[kind]).sort();
    assert.deepEqual(Object.keys(CONFIG[kind].dataModels).sort(), expected);
    assert.deepEqual(registered.filter(([k]) => k === kind).flatMap(([, scope,, opts]) => {
      assert.equal(scope, "midgard5"); assert.equal(opts.makeDefault, true); return opts.types;
    }).sort(), expected);
  }
});

test("LP, AP and GW defaults exist for every actor; numeric zero is preserved", () => {
  for (const [type, Model] of Object.entries(CONFIG.Actor.dataModels)) {
    assert.deepEqual(CONFIG.Actor.trackableAttributes[type].bar, ["lp", "ap"]);
    const schema = Model.defineSchema();
    assert.equal(schema.lp.fields.value.options.initial, 15);
    assert.equal(schema.ap.fields.max.options.initial, 20);
    assert.equal(schema.gw.fields.bonus.options.initial, 0);
    assert.equal(schema.gs.fields.value.options.initial, 50);
  }
  assert.notEqual(makeSchema(defaults.Actor.character).lp, makeSchema(defaults.Actor.character).lp);
});

test("legacy resk is copied only if the corrected field is absent", () => {
  const model = CONFIG.Item.dataModels.race;
  assert.equal(model.migrateData({ mod: { resk: 4 } }).mod.resK, 4);
  assert.equal(model.migrateData({ mod: { resk: 4, resK: 0 } }).mod.resK, 0);
});

test("item icon hook applies only to known types without custom artwork", () => {
  let recorded;
  const item = { type: "skill", updateSource: patch => { recorded = patch; } };
  const handler = on.get("preCreateItem");
  handler(item, { img: "existing.webp" });
  assert.equal(recorded, undefined);
  handler(item, {});
  assert.equal(recorded.img, "systems/midgard5/assets/icons/default/skill.svg");
  recorded = undefined;
  handler({ ...item, type: "unknown" }, {});
  assert.equal(recorded, undefined);
});

test("registered sheet templates use V14 system paths and have no nested form", async () => {
  const root = new URL("../", import.meta.url);
  for (const [kind,, Klass] of registered) {
    const instance = new Klass();
    instance.isEditable = true;
    instance.document = { system: { lp: { value: 4 }, description: "<p>Probe</p>" }, items: { contents: [] } };
    const context = await instance._prepareContext({});
    assert.equal(context.system.lp.value, 4);
    assert.equal(context.core, true);
    assert.equal(context.descriptionHTML, "<p>Probe</p>");
    assert.equal(context.editable, true);
    for (const part of Object.values(Klass.PARTS)) {
      const filename = part.template.replace("systems/midgard5/", "");
      const html = await readFile(new URL(filename, root), "utf8");
      assert.doesNotMatch(html, /<\/?form\b|name="data\.|\{\{editor\b|\{\{#select\b/);
      for (const partial of part.templates ?? []) {
        await access(new URL(partial.replace("systems/midgard5/", ""), root));
      }
    }
    if (kind === "Actor") assert.deepEqual(context.items, []);
  }
});

test("all custom HTML schemas are explicitly declared for server sanitization", () => {
  for (const [kind, models] of Object.entries({ Actor: CONFIG.Actor.dataModels, Item: CONFIG.Item.dataModels })) {
    for (const [type, Model] of Object.entries(models)) {
      const htmlFields = Object.entries(Model.defineSchema())
        .filter(([, field]) => field instanceof HTMLField).map(([path]) => path).sort();
      assert.deepEqual(htmlFields, ["description"], `${kind}.${type} shared sheet needs description`);
      assert.deepEqual(manifest.documentTypes[kind][type].htmlFields, htmlFields, `${kind}.${type}`);
    }
  }
});
