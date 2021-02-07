import m5ItemSheet from "./module/sheets/m5ItemSheet.js";
import m5CharacterSheet from "./module/sheets/m5CharacterSheet.js";

Hooks.once("init", function () {
  console.log("M5 | Initialisierung Midgard 5");

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("midgard5", m5ItemSheet, { makeDefault: true });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("midgard5", m5CharacterSheet, { makeDefault: true });
});
