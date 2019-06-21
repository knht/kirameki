module.exports = {
    LEAGUE_OF_LEGENDS: {
        MAP_MODE_DATA: {
            0: {
                map: 'Unknown',
                mode: 'Custom Game'
            },
            72: {
                map: 'Howling Abyss',
                mode: '1v1 Snowdown Showdown'
            },
            73: {
                map: 'Howling Abyss',
                mode: '2v2 Snowdown Showdown'
            },
            75: {
                map: 'Summoner\'s Rift',
                mode: '6v6 Hexakill'
            },
            76: {
                map: 'Summoner\'s Rift',
                mode: 'URF'
            },
            78: {
                map: 'Howling Abyss',
                mode: 'One For All: Mirror Mode'
            },
            83: {
                map: 'Summoner\'s Rift',
                mode: 'Co-op vs AI URF'
            },
            98: {
                map: 'Twisted Treeline',
                mode: '6v6 Hexakill'
            },
            100: {
                map: 'Butcher\'s Bridge',
                mode: '5v5 ARAM'
            },
            310: {
                map: 'Summoner\'s Rift',
                mode: 'Nemesis'
            },
            313: {
                map: 'Summoner\'s Rift',
                mode: 'Black Market Brawlers'
            },
            317: {
                map: 'Crystal Scar',
                mode: 'Definitely Not Dominion'
            },
            325: {
                map: 'Summoner\'s Rift',
                mode: 'All Random'
            },
            400: {
                map: 'Summoner\'s Rift',
                mode: '5v5 Draft Pick'
            },
            420: {
                map: 'Summoner\'s Rift',
                mode: '5v5 Ranked Solo'
            },
            430: {
                map: 'Summoner\'s Rift',
                mode: '5v5 Blind Pick'
            },
            440: {
                map: 'Summoner\'s Rift',
                mode: '5v5 Ranked Flex'
            },
            450: {
                map: 'Howling Abyss',
                mode: 'ARAM'
            },
            460: {
                map: 'Twisted Treeline',
                mode: '3v3 Blind Pick'
            },
            470: {
                map: 'Twisted Treeline',
                mode: '3v3 Ranked Flex'
            },
            600: {
                map: 'Summoner\'s Rift',
                mode: 'Blood Hunt Assassin'
            },
            610: {
                map: 'Cosmic Ruins',
                mode: 'Dark Star: Singularity'
            },
            700: {
                map: 'Summoner\'s Rift',
                mode: 'Clash'
            },
            800: {
                map: 'Twisted Treeline',
                mode: 'Co-op vs. AI Intermediate Bots'
            },
            810: {
                map: 'Twisted Treeline',
                mode: 'Co-op vs. AI Intro Bots'
            },
            820: {
                map: 'Twisted Treeline',
                mode: 'Co-op vs. AI Beginner Bots'
            },
            830: {
                map: 'Summoner\'s Rift',
                mode: 'Co-op vs. AI Intro Bots'
            },
            840: {
                map: 'Summoner\'s Rift',
                mode: 'Co-op vs. AI Beginner Bots'
            },
            850: {
                map: 'Summoner\'s Rift',
                mode: 'Co-op vs. AI Intermediate Bots'
            },
            900: {
                map: 'Summoner\'s Rift',
                mode: 'ARURF'
            },
            910: {
                map: '	Crystal Scar',
                mode: 'Ascension'
            },
            920: {
                map: 'Howling Abyss',
                mode: 'Legend of the Poro King'
            },
            940: {
                map: 'Summoner\'s Rift',
                mode: 'Nexus Siege'
            },
            950: {
                map: 'Summoner\'s Rift',
                mode: 'Doom Bots Voting'
            },
            960: {
                map: 'Summoner\'s Rift',
                mode: 'Doom Bots Standard'
            },
            980: {
                map: 'Valoran City Park',
                mode: 'Star Guardian Invasion: Normal'
            },
            990: {
                map: 'Valoran City Park',
                mode: 'Star Guardian Invasion: Onslaught'
            },
            1000: {
                map: 'Overcharge',
                mode: 'PROJECT: Hunters'
            },
            1010: {
                map: 'Summoner\'s Rift',
                mode: 'Snow ARURF'
            },
            1020: {
                map: 'Summoner\'s Rift',
                mode: 'One for All'
            }
        },
        REGION: {
            getServerByRegion: (region) => {
                let server;

                switch (region.toLowerCase()) {
                    case 'br':
                        server = 'br1';
                        break;

                    case 'eune':
                    case 'eun':
                        server = 'eun1';
                        break;

                    case 'euw':
                        server = 'euw1';
                        break;

                    case 'jp':
                    case 'ja':
                        server = 'jp1';
                        break;

                    case 'kr':
                        server = 'kr';
                        break;

                    case 'lan':
                        server = 'la1';
                        break;

                    case 'las':
                        server = 'la2';
                        break;

                    case 'na':
                        server = 'na1';
                        break;

                    case 'oce':
                    case 'oc':
                        server = 'oc1';
                        break;

                    case 'tr':
                        server = 'tr1';
                        break;

                    case 'ru':
                        server = 'ru';
                        break;

                    case 'pbe':
                        server = 'pbe1';
                        break;
                }

                return server;
            }
        }
    },
    MAGIC_CONCH_SHELL: {
        PREDICTIONS: [
            "It is certain",
            "It is decidedly so",
            "Without a doubt",
            "Yes definitely",
            "You may rely on it",
            "As I see it, yes",
            "Most likely",
            "Outlook good",
            "Yes",
            "Signs point to yes",
            "Reply hazy try again",
            "Ask again later",
            "Better not tell you now",
            "Cannot predict now",
            "Concentrate and ask again",
            "Don't count on it",
            "My reply is no",
            "My sources say no",
            "Outlook not so good",
            "Very doubtful"
        ]
    },
    MATH_ADDITIONS: {
        SI_SYMBOLS: ["", "K", "M", "G", "T", "P", "E"]
    }
}