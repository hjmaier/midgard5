import { midgard5 } from "./module/config.js";
import { defaults } from "./module/data/defaults.js";
import { makeDataModels } from "./module/data/models.js";
import { MidgardActorSheet, MidgardItemSheet, MidgardRaceSheet,
  MidgardSkillSheet, MidgardTypeSheet } from "./module/sheets/v14-sheets.js";

Hooks.once("init", () => {
  CONFIG.midgard5 = midgard5;
  const { Actor, Item } = makeDataModels();
  Object.assign(CONFIG.Actor.dataModels, Actor);
  Object.assign(CONFIG.Item.dataModels, Item);
  CONFIG.Actor.trackableAttributes = Object.fromEntries(
    Object.keys(defaults.Actor).map(type => [type, { bar: ["lp", "ap"], value: [] }])
  );

  const { DocumentSheetConfig } = foundry.applications.apps;
  const register = (documentClass, sheet, types, label) => DocumentSheetConfig.registerSheet(
    documentClass, "midgard5", sheet, { types, label, makeDefault: true }
  );
  register(CONFIG.Actor.documentClass, MidgardActorSheet, Object.keys(defaults.Actor), "MIDGARD 5");
  register(CONFIG.Item.documentClass, MidgardItemSheet, ["item", "weaponcl", "weaponrn", "weapondf", "armor"], "MIDGARD 5");
  register(CONFIG.Item.documentClass, MidgardSkillSheet, ["skill", "spell", "language", "untrained", "sense"], "MIDGARD 5");
  register(CONFIG.Item.documentClass, MidgardRaceSheet, ["race"], "MIDGARD 5");
  register(CONFIG.Item.documentClass, MidgardTypeSheet, ["type"], "MIDGARD 5");
});

Hooks.on("preCreateItem", (item, data) => {
  if (!data.img && Object.hasOwn(defaults.Item, item.type)) {
    item.updateSource({ img: `systems/midgard5/assets/icons/default/${item.type}.svg` });
  }
});
