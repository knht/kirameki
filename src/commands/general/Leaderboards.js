const KiramekiHelper = require('../../KiramekiHelper');

class Leaderboards {
    constructor() {
        this.name = 'leaderboard';
        this.aliases = ['leaderboards'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.help = {
            message: 'Access all the different kinds of leaderboards available on Kirameki.\nCurrently available leaderboards: `osu`, `xp`',
            usage: 'leaderboard <board>',
            example: ['leaderboard xp', 'leaderboard osu'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, leaderboard] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!leaderboard) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));

        switch (leaderboard.toLowerCase()) {
            case 'xp': {
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('DEFAULT')
                    .setAuthor(
                        'Click here for the global XP leaderboard!', 
                        KiramekiHelper.images.KIRAMEKI_MASCOT, 
                        KiramekiHelper.links.WEBSITE.LEADERBOARDS.XP
                    )
                );

                break;
            }

            case 'osu': {
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('DEFAULT')
                    .setAuthor(
                        `Click here for ${message.channel.guild.name}'s osu! Leaderboard!`, 
                        KiramekiHelper.images.KIRAMEKI_MASCOT, 
                        `${KiramekiHelper.links.WEBSITE.LEADERBOARDS.OSU.getLeaderboardURL(message.channel.guild.id)}`
                    )
                );

                KiramekiHelper.updateOsuLeaderboards(kirCore.DB, message);
                break;
            }

            default: {
                return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'LEADERBOARDS', `${KiramekiHelper.userLogCompiler(message.author)} just used the leaderboard command.`);
    }
}

module.exports = new Leaderboards();