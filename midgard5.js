import {midgard5} from "./module/config.js";
import m5ItemSheet from "./module/sheets/m5ItemSheet.js";
import m5CharacterSheet from "./module/sheets/m5CharacterSheet.js";
import m5SkillSheet from "./module/sheets/m5SkillSheet.js";

Hooks.once("init", function () {
  console.log("M5 | Initialisierung Midgard 5");

  CONFIG.midgard5 = midgard5;

// Default Sheet für Items definieren und das Standardsheet deaktivieren

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("midgard5", m5ItemSheet, { makeDefault: true });
  Items.registerSheet("midgard5", m5SkillSheet, { makeDefault: false });

// Default Sheet für Actors definieren und das Standardsheet deaktivieren

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("midgard5", m5CharacterSheet, { makeDefault: true });
});
