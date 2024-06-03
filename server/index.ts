import * as alt from 'alt-server';
import { AnimationMenuEvents } from '../shared/events.js';
import { useAnimation } from '@Server/player/animation.js';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();
const { getMany, create } = Rebar.database.useDatabase();

const ANIMATION_COLLECTION = 'Animations';

async function fetchAnimationsFromDatabase() {
    try {
        const results = await getMany({}, ANIMATION_COLLECTION);
        if (results.length <= 0) {
            alt.log('Could not find any animations in the database!');
            return [];
        }

        return results;
    } catch (err) {
        alt.log(`Error fetching animations: ${err}`);
        return [];
    }
}

async function addAnimationToDatabase(category, name, dict, animation, flag, duration) {
    try {
        const newAnimation = { category, name, dict, animation, flag, duration };
        const _id = await create(newAnimation, ANIMATION_COLLECTION);
        if (_id) {
            alt.log(`Added new animation: ${name} (${_id})`);
        } else {
            alt.log('Failed to add new animation');
        }
    } catch (err) {
        alt.log(`Error adding animation: ${err}`);
    }
}

alt.onClient(AnimationMenuEvents.ToServer.RequestAnimsFromDatabase, async (player) => {
    const animationsData = await fetchAnimationsFromDatabase();
    alt.emitClient(player, AnimationMenuEvents.ToClient.CreateMenu, animationsData);
});

alt.onClient(AnimationMenuEvents.ToServer.PlayAnimation, (player, anim) => {
    if (!anim) {
        useAnimation(player).clear();
        return;
    }
    if (anim.duration) {
        useAnimation(player).playFinite(anim.dict, anim.animation, anim.flag, anim.duration);
    } else {
        useAnimation(player).playInfinite(anim.dict, anim.animation, anim.flag);
    }
    useRebar().messenger.useMessenger().message.send(player, {
        type: 'system',
        content: 'Animation started! To stop animation use /stopanim',
    });
});

useRebar()
    .messenger.useMessenger()
    .commands.register({
        name: 'stopanim',
        desc: 'Stop current animation',
        callback: (player) => {
            useAnimation(player).clear();
            useRebar().messenger.useMessenger().message.send(player, {
                type: 'system',
                content: 'Stopped animation if present',
            });
        },
    });

useRebar()
    .messenger.useMessenger()
    .commands.register({
        name: 'addanimation',
        desc: 'Add a new animation to the database',
        callback: (player, ...args) => {
            if (args.length < 5) {
                useRebar().messenger.useMessenger().message.send(player, {
                    type: 'alert',
                    content: 'Usage: /addanimation [category] [name] [dict] [animation] [flag] [duriation]',
                });
                return;
            }

            const [category, name, dict, animation, flag, duration] = args;
            const flagInt = parseInt(flag, 10);
            const durationInt = duration ? parseInt(duration, 10) : 0;

            if (isNaN(flagInt)) {
                useRebar().messenger.useMessenger().message.send(player, {
                    type: 'alert',
                    content: 'Flag must be a number',
                });
                return;
            }

            addAnimationToDatabase(
                category.replaceAll('_', ' '),
                name.replaceAll('_', ' '),
                dict,
                animation,
                flagInt,
                durationInt,
            );
            useRebar()
                .messenger.useMessenger()
                .message.send(player, {
                    type: 'system',
                    content: `Animation ${name} added to category ${category}`,
                });
        },
    });
