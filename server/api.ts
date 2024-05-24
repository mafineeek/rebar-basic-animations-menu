import { useRebar } from '@Server/index.js';
import { useApi } from '@Server/api/index.js';

const Rebar = useRebar();
const database = Rebar.database.useDatabase();

export const useAnimationMenu = () => {
    const insertAnimation = (category, name, dict, animation, flag) => {
        database.create({
            category,
            name,
            dict,
            animation,
            flag
        }, 'Animations');
    }

    return {
        insertAnimation
    }
}

declare global {
    export interface ServerPlugin {
        ['animation-menu-api']: ReturnType<typeof useAnimationMenu>;
    }
}

useApi().register('animation-menu-api', useAnimationMenu());
