export default class m5Hooks {

    static onPreCreateItem(createData, options, userId) {
        //Set default image if no image already exists
        if (!createData.img) {
            createData.img = `systems/midgard5/assets/icons/default/${createData.type}.svg`;
        }
    }
}