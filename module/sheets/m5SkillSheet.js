export default class m5SkillSheet extends ItemSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 530,
      height: 340,
      classes: ["midgard5", "sheet", "skill"]
    });
  }

  get template() {
    return 'systems/midgard5/templates/sheets/m5Skill-Sheet.hbs';
  }

  getData() {
    const data = super.getData();

    data.config = CONFIG.midgard5;

    return data;
  }
}