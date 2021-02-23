import {midgard5} from "./module/config.js";
import m5Hooks from "./module/m5Hooks.js";
import m5ItemSheet from "./module/sheets/m5ItemSheet.js";
import m5CharacterSheet from "./module/sheets/m5CharacterSheet.js";
import m5SkillSheet from "./module/sheets/m5SkillSheet.js";

Hooks.once("init", function () {
  console.log("M5 | Initialisierung Midgard 5");

  CONFIG.midgard5 = midgard5;

// Default Sheet für Items definieren und das Standardsheet deaktivieren

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("midgard5", m5ItemSheet, { types: ["item"], makeDefault: true });
  Items.registerSheet("midgard5", m5SkillSheet, { types: ["skill"], makeDefault: true });

// Default Sheet für Actors definieren und das Standardsheet deaktivieren

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("midgard5", m5CharacterSheet, { makeDefault: true });
});

Hooks.on("preCreateItem", (createData, options, userId) => m5Hooks.onPreCreateItem(createData, options, userId));
