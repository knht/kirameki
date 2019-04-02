module.exports = {
    OSU_LOGO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Osulogo.png/286px-Osulogo.png',
    OSU_PIPPI_SAD: 'https://i.imgur.com/Wa00gFg.png',
    OSU_STRAIN_GRAPH_BACKGROUND: 'https://img.kirameki.one/IizpW6sj.jpg',
    DEFAULT_DISCORD: 'https://img.kirameki.one/tJIX0aeZ.png',
    LEVEL_UP_OVERLAY: 'https://img.kirameki.one/9XzqmSAt.png',
    KIRAMEKI_MASCOT: 'https://kirameki.one/images/kirameki.png',
    PROFILE_CARD: {
        DEFAULT_BACKGROUND: 'https://img.kirameki.one/LTqHsfYS.jpg',
        GURU_BADGE: 'https://img.kirameki.one/gBd284Hs.png',
        PEACEKEEPER_BADGE: 'https://img.kirameki.one/GGaghPuT.png',
        OWNER_BADGE: 'https://img.kirameki.one/8A5fZRMN.png',
        OHK_BADGE: 'https://img.kirameki.one/gB9anVUA.png'
    },
    GAMBLING: {
        COINFLIP: {
            HEADS: 'https://img.kirameki.one/NjGmSO7u.png',
            TAILS: 'https://img.kirameki.one/Sv8jworZ.png'
        },
        DICE: {
            getFace: (number) => {
                return `https://kirameki.one/api/dice/${number}.png`;
            }
        }
    }
};