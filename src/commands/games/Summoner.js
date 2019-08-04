const KiramekiHelper = require('../../KiramekiHelper');

class Summoner {
    constructor() {
        this.name = 'league';
        this.aliases = ['summoner', 'leagueoflegends'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.GAMES;
        this.cooldown = 5;
        this.help = {
            message: 'Get account, mastery, tier and game data about any player in League of Legends.',
            usage: 'league <server> <summonerName>',
            example:  ['league euw Bjergsen', 'league kr Faker'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, region, summoner] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const server = KiramekiHelper.other.LEAGUE_OF_LEGENDS.REGION.getServerByRegion(region);

        if (!region || !summoner) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        if (region && !server) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`There is no supported server region called **${region}**!`)
            );
        }

        /**
         * @todo Find workaround for missing Riot API endpoints and rewrite all of the League of Legends commands.
         */
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('RED')
            .setTitle('Currently under maintenance')
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SUMMONER', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Summoner();