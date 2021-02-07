export default class m5CharacterSheet extends ActorSheet {
  
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        template: "systems/midgard5/templates/sheets/m5Character-Sheet.hbs",
        width: 530,
        height: 400,
        classes: ["midgard5", "sheet", "character"]
      });
    }
  
    // get template() {
    //     return 'systems/midgard5/templates/sheets/m5Character-Sheet.hbs';
    // }
  }