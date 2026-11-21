import { defaults } from "./defaults.js";

function makeField(value) {
  const { BooleanField, NumberField, ObjectField, SchemaField, StringField } = foundry.data.fields;
  if (typeof value === "boolean") return new BooleanField({ initial: value });
  if (typeof value === "number") return new NumberField({ initial: value, nullable: false });
  if (typeof value === "string") return new StringField({ initial: value, blank: true });
  if (Object.keys(value).length === 0) return new ObjectField({ initial: {} });
  return new SchemaField(makeSchema(value));
}

export function makeSchema(fields) {
  return Object.fromEntries(Object.entries(fields).map(([name, value]) => [
    name, name === "description" ? new foundry.data.fields.HTMLField({ initial: value }) : makeField(value)
  ]));
}

export function makeDataModels() {
  const base = foundry.abstract.TypeDataModel;
  return Object.fromEntries(Object.entries(defaults).map(([kind, types]) => [kind,
    Object.fromEntries(Object.entries(types).map(([id, fields]) => [id, class extends base {
      static defineSchema() { return makeSchema(fields); }

      static migrateData(data) {
        if (data.mod?.resk !== undefined && data.mod.resK === undefined) data.mod.resK = data.mod.resk;
        return super.migrateData(data);
      }
    }]))
  ]));
}
