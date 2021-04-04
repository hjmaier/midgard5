import {midgard5} from "./module/config.js";
import m5Hooks from "./module/m5Hooks.js";
import m5CharacterSheet from "./module/sheets/actor/m5CharacterSheet.js";
import m5ItemSheet from "./module/sheets/item/m5ItemSheet.js";
import m5SkillSheet from "./module/sheets/item/m5SkillSheet.js";
import m5RaceSheet from "./module/sheets/item/m5RaceSheet.js";
import m5TypeSheet from "./module/sheets/item/m5TypeSheet.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/midgard5/templates/sheets/item/partials/header.hbs",
    "systems/midgard5/templates/sheets/item/partials/bonus.hbs",
    "systems/midgard5/templates/sheets/item/partials/basics.hbs"
  ];
  return loadTemplates(templatePaths);
};

Hooks.once("init", function () {
  console.log("M5 | Initialisierung Midgard 5");

  CONFIG.midgard5 = midgard5;



// Default Sheet für Items definieren und das Standardsheet deaktivieren

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("midgard5", m5ItemSheet, { makeDefault: true });
  Items.registerSheet("midgard5", m5ItemSheet, { types: ["item"], makeDefault: true });
  Items.registerSheet("midgard5", m5SkillSheet, { types: ["skill"], makeDefault: true });
  Items.registerSheet("midgard5", m5TypeSheet, { types: ["type"], makeDefault: true });
  Items.registerSheet("midgard5", m5RaceSheet, { types: ["race"], makeDefault: true });

// Default Sheet für Actors definieren und das Standardsheet deaktivieren

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("midgard5", m5CharacterSheet, { makeDefault: true });

  preloadHandlebarsTemplates();
});

Hooks.on("preCreateItem", (createData, options, userId) => m5Hooks.onPreCreateItem(createData, options, userId));
