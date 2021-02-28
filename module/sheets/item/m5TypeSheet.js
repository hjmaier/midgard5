export default class m5TypeSheet extends ItemSheet {

    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        width: 530,
        height: 340,
        classes: ["midgard5", "sheet", "type"]
      });
    }
  
    get template() {
      return `systems/midgard5/templates/sheets/item/m5Type-Sheet.hbs`;
    }
  
    getData() {
      const data = super.getData();
  
      data.config = CONFIG.midgard5;
  
      return data;
    }
  }
  