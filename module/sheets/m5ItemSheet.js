export default class m5ItemSheet extends ItemSheet {
  
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 530,
      height: 340,
      classes: ["midgard5", "sheet", "item"]
    });
  }

  get template() {
      return `systems/midgard5/templates/sheets/m5${this.item.data.type}-Sheet.hbs`;
  }
}
