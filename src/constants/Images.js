module.exports = {
    OSU_LOGO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Osulogo.png/286px-Osulogo.png',
    OSU_PIPPI_SAD: 'https://i.imgur.com/Wa00gFg.png',
    OSU_STRAIN_GRAPH_BACKGROUND: 'https://img.kirameki.one/IizpW6sj.jpg',
    DEFAULT_DISCORD: 'https://img.kirameki.one/tJIX0aeZ.png',
    LEVEL_UP_OVERLAY: 'https://img.kirameki.one/9XzqmSAt.png',
    KIRAMEKI_MASCOT: 'https://img.kirameki.one/AchEKt3g.png',
    KIRAMEKI_SAD: 'https://img.kirameki.one/oL0cbCuW.gif',
    LOVE_METER_OVERLAY: 'https://img.kirameki.one/n1p9sOzq.png',
    PSIKWOW: 'https://i.imgur.com/P5ikWow.jpg',
    KAEDE_BACKGROUND: 'https://img.kirameki.one/YGWA7GoH.jpg',
    SAGIRI_BACKGROUND: 'https://img.kirameki.one/bffOcH0D.png',
    CHANGE_MY_MIND_BACKGROUND: 'https://img.kirameki.one/kFFwx3x2.png',
    EINSTEIN_BACKGROUND: 'https://img.kirameki.one/q8mbEBDt.jpg',
    SPONGEMOCK_BACKGROUND: 'https://img.kirameki.one/OgLYHzPd.png',
    OVERWATCH_LOGO: 'https://img.kirameki.one/AdnMGGPd.png',
    URBAN_DICTIONARY_LOGO: 'https://img.kirameki.one/ukMhU5LU.jpg',
    WIKIPEDIA_LOGO: 'https://img.kirameki.one/zgqRn9cH.png',
    TRANSLATE_LOGO: 'https://img.kirameki.one/4MW9TpXp.png',
    POKEBALL_LOGO: 'https://img.kirameki.one/JNwz33yz.png',
    LEAGUE_OF_LEGENDS_LOGO: 'https://img.kirameki.one/9RmW4sPs.png',
    WEATHER: {
        getWeatherIcon: (iconName) => {
            return `https://kirameki.one/weathericons/${iconName}.png?uts=${Math.floor(new Date() / 1000)}`
        }
    },
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
    },
    MAGIC_CONCH_SHELL: {
        ICON: 'https://i.imgur.com/0KUTNHb.png',
        THUMBNAIL: 'https://i.imgur.com/6aMnknd.jpg'
    },
    FORTNITE: {
        LOGO: 'https://img.kirameki.one/leYDOObl.jpg',
        THUMBNAIL: 'https://img.kirameki.one/hJk8H4IT.jpg'
    }
};