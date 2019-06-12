const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const fnClient       = require('fortnite');

class Fortnite {
    constructor() {
        this.name = 'fortnite';
        this.aliases = ['fn'];
        this.cooldown = 5;
        this.category = KiramekiHelper.categories.GAMES;  
        this.fortnite = new fnClient(KiramekiConfig.fortniteApiKey);
        this.help = {
            message: 'Get up to date stats of a specified Fortnite player.',
            usage: 'fortnite <username>',
            example: 'fortnite Ninja',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, ftnLookupUsername] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        if (!ftnLookupUsername) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        try {
            const ftnResultset = await this.fortnite.user(ftnLookupUsername, 'pc');

            // Solo Stats
            const ftnUserStatsSoloKD		= ftnResultset.stats.solo.kd;
            const ftnUserStatsSoloWins		= ftnResultset.stats.solo.wins;
            const ftnUserStatsSoloKills		= ftnResultset.stats.solo.kills;
            const ftnUserStatsSoloMatches	= ftnResultset.stats.solo.matches;
            const ftnUserStatsSoloWinP		= ((ftnUserStatsSoloWins / ftnUserStatsSoloMatches) * 100).toFixed(2) + '%';

            // Duo Stats
            const ftnUserStatsDuoKD			= ftnResultset.stats.duo.kd;
            const ftnUserStatsDuoWins		= ftnResultset.stats.duo.wins;
            const ftnUserStatsDuoKills		= ftnResultset.stats.duo.kills;
            const ftnUserStatsDuoMatches	= ftnResultset.stats.duo.matches;
            const ftnUserStatsDuoWinP		= ((ftnUserStatsDuoWins / ftnUserStatsDuoMatches) * 100).toFixed(2) + '%';

            // Squad Stats
            const ftnUserStatsSquadKD		= ftnResultset.stats.squad.kd;
            const ftnUserStatsSquadWins		= ftnResultset.stats.squad.wins;
            const ftnUserStatsSquadKills	= ftnResultset.stats.squad.kills;
            const ftnUserStatsSquadMatches	= ftnResultset.stats.squad.matches;
            const ftnUserStatsSquadWinP		= ((ftnUserStatsSquadWins / ftnUserStatsSquadMatches) * 100).toFixed(2) + '%';

            // User Stats
            const ftnUsername				= ftnResultset.username;
            const ftnUserMatchesAll			= ftnUserStatsSoloMatches 	+ ftnUserStatsDuoMatches 	+ ftnUserStatsSquadMatches;
            const ftnUserKillsAll			= ftnUserStatsSoloKills		+ ftnUserStatsDuoKills		+ ftnUserStatsSquadKills;
            const ftnUserKDAll				= ftnResultset.stats.lifetime.kd;
            const ftnUserWinsAll			= ftnResultset.stats.lifetime.wins;
            const ftnUserWinPAll			= ((ftnUserWinsAll / ftnUserMatchesAll) * 100).toFixed(2) + '%';

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setAuthor('Fortnite Stats', KiramekiHelper.images.FORTNITE.LOGO)
                .setDescription('Most recent stats for following Fortnite player:')
                .setThumbnail(KiramekiHelper.images.FORTNITE.THUMBNAIL)
                .addBlankField()
                .addField('Username', `**${ftnUsername}**`, true)
                .addField('Platform', '**PC**', true)
                .addBlankField(false)
                .addField(
                    'Solo Stats',
                    `**K/D:** ${ftnUserStatsSoloKD}\n` + 
                    `**Wins:** ${ftnUserStatsSoloWins}\n` +
                    `**Kills:** ${ftnUserStatsSoloKills}\n` + 
                    `**Winrate:** ${ftnUserStatsSoloWinP}\n` + 
                    `**Matches:** ${ftnUserStatsSoloMatches}`,
                    true
                )
                .addField(
                    'Duo Stats',
                    `**K/D:** ${ftnUserStatsDuoKD}\n` + 
                    `**Wins:** ${ftnUserStatsDuoWins}\n` +
                    `**Kills:** ${ftnUserStatsDuoKills}\n` + 
                    `**Winrate:** ${ftnUserStatsDuoWinP}\n` + 
                    `**Matches:** ${ftnUserStatsDuoMatches}`,
                    true
                )
                .addBlankField(false)
                .addField(
                    'Squad Stats',
                    `**K/D:** ${ftnUserStatsSquadKD}\n` + 
                    `**Wins:** ${ftnUserStatsSquadWins}\n` +
                    `**Kills:** ${ftnUserStatsSquadKills}\n` + 
                    `**Winrate:** ${ftnUserStatsSquadWinP}\n` + 
                    `**Matches:** ${ftnUserStatsSquadMatches}`,
                    true
                )
                .addField(
                    'Lifetime Stats',
                    `**K/D:** ${ftnUserKDAll}\n` + 
                    `**Wins:** ${ftnUserWinsAll}\n` +
                    `**Kills:** ${ftnUserKillsAll}\n` + 
                    `**Winrate:** ${ftnUserWinPAll}\n` + 
                    `**Matches:** ${ftnUserMatchesAll}`,
                    true
                )
                .setFooter(`Fortnite stats requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
            );
        } catch (fortniteAPIerror) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`We couldn't find a Fortnite player called **${ftnLookupUsername}**!`)
            );
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'FORTNITE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Fortnite();