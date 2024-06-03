import * as alt from 'alt-client';
import { useNativeMenu } from '@Client/menus/native/index.js';
import { AnimationMenuEvents } from '../shared/events.js';

let mainMenu = null;
let currentMenu = null;

function createMenu(anims) {
    const categories = [];
    const uniqueCategories = anims.filter((animCategory) => {
        if (categories.includes(animCategory.category)) {
            return false;
        }
        categories.push(animCategory.category);
        return true;
    });

    console.log('categories ' + JSON.stringify(categories));
    console.log('unique categories ' + JSON.stringify(uniqueCategories));

    const options = uniqueCategories.map((animCategory) => ({
        text: animCategory.category,
        type: 'invoke',
        value: '',
        callback: () => {
            openSubMenu(
                animCategory.category,
                anims.filter((anim) => anim.category === animCategory.category),
            );
        },
    }));

    return useNativeMenu({
        header: 'Main Menu',
        noExit: false,
        options: options,
    });
}

function openSubMenu(header, animations) {
    if (currentMenu) {
        currentMenu.destroy();
    }
    console.log(`animations ${JSON.stringify(animations)}`);
    const options = animations.map((anim) => ({
        text: anim.name,
        type: 'invoke',
        value: '',
        callback: () => {
            alt.log(`${anim.name} selected`);
            alt.emitServer(AnimationMenuEvents.ToServer.PlayAnimation, anim);
        },
    }));

    currentMenu = useNativeMenu({
        header: `${header} Menu`,
        backCallback: () => {
            currentMenu.destroy();
            mainMenu.open();
        },
        options: options,
    });

    currentMenu.open();
}

function openMainMenu(anims) {
    if (mainMenu) {
        mainMenu.destroy();
    }
    mainMenu = createMenu(anims);
    currentMenu = mainMenu;
    mainMenu.open();
}

alt.on('keydown', (key) => {
    if (key === 114) {
        // F3 key
        alt.emitServer(AnimationMenuEvents.ToServer.RequestAnimsFromDatabase);
    }
});

alt.onServer(AnimationMenuEvents.ToClient.CreateMenu, openMainMenu);
