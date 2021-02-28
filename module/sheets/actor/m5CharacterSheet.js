export default class m5CharacterSheet extends ActorSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/midgard5/templates/sheets/actor/m5Character-Sheet.hbs",
      width: 530,
      height: 400,
      classes: ["midgard5", "sheet", "character"]
    });
  }

  // get template() {
  //     return 'systems/midgard5/templates/sheets/actor/m5Character-Sheet.hbs';
  // }

  getData() {
    const data = super.getData();

    data.config = CONFIG.midgard5;

    return data;
  }
}