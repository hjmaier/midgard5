export default class m5RaceSheet extends ItemSheet {

    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        width: 530,
        height: 340,
        classes: ["midgard5", "sheet", "race"]
      });
    }
  
    get template() {
      return `systems/midgard5/templates/sheets/item/m5Race-Sheet.hbs`;
    }
  
    getData() {
      const data = super.getData();
  
      data.config = CONFIG.midgard5;
  
      return data;
    }
  }
  