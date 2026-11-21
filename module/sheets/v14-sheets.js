import { midgard5 } from "../config.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { FilePicker } = foundry.applications.apps;
const { TextEditor } = foundry.applications.ux;
const sheetPath = "systems/midgard5/templates/sheets";

function enrichDescription(document) {
  return TextEditor.enrichHTML(document.system.description ?? "", {
    relativeTo: document, secrets: document.isOwner
  });
}

function labels(options) {
  return Object.fromEntries(Object.entries(options).map(([key, label]) => [
    key === "none" ? "" : key, label.trim() ? game.i18n.localize(label) : ""
  ]));
}

async function editImage(_event, target) {
  if (!this.isEditable) return;
  new FilePicker.implementation({
    type: "image", current: this.document.img,
    callback: img => this.document.update({ img })
  }).browse();
}

async function editItem(_event, target) {
  const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
  if (item) await item.sheet.render({ force: true });
}

async function deleteItem(_event, target) {
  if (!this.isEditable) return;
  const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
  if (item) await item.deleteDialog();
}

export class MidgardActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["midgard5", "sheet", "character"],
    position: { width: 560, height: 480 },
    window: { resizable: true },
    actions: { editImage, editItem, deleteItem }
  };

  static PARTS = {
    body: { template: `${sheetPath}/actor/m5Character-Sheet.hbs`,
      templates: [`${sheetPath}/description.hbs`] },
    buttons: { template: `${sheetPath}/save.hbs` }
  };

  async _prepareContext(options) {
    return { ...await super._prepareContext(options), actor: this.document,
      items: this.document.items.contents, system: this.document.system, editable: this.isEditable,
      descriptionHTML: await enrichDescription(this.document) };
  }
}

function createItemSheet(sheet) {
  return class extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
      classes: ["midgard5", "sheet", "item"],
      position: { width: 560, height: 520 },
      window: { resizable: true },
      actions: { editImage }
    };

    static PARTS = {
      body: {
        template: `${sheetPath}/item/m5${sheet}-Sheet.hbs`,
        templates: [`${sheetPath}/description.hbs`,
          ...["header", "bonus", "basics"].map(name => `${sheetPath}/item/partials/${name}.hbs`)]
      },
      buttons: { template: `${sheetPath}/save.hbs` }
    };

    async _prepareContext(options) {
      return { ...await super._prepareContext(options), item: this.document,
        system: this.document.system, editable: this.isEditable,
        descriptionHTML: await enrichDescription(this.document),
        attributeOptions: labels(midgard5.attributeList), learningOptions: labels(midgard5.lernListe) };
    }
  };
}

export class MidgardItemSheet extends createItemSheet("Item") {}
export class MidgardSkillSheet extends createItemSheet("Skill") {}
export class MidgardRaceSheet extends createItemSheet("Race") {}
export class MidgardTypeSheet extends createItemSheet("Type") {}
