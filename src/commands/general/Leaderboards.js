const KiramekiHelper = require('../../KiramekiHelper');

class Leaderboards {
    constructor() {
        this.name = 'leaderboard';
        this.aliases = ['leaderboards', 'lb'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.help = {
            message: 'Access all the different kinds of leaderboards available on Kirameki.\nCurrently available leaderboards: `osu`, `xp`, `guild` or `server`',
            usage: 'leaderboard <board>',
            example: ['leaderboard xp', 'leaderboard osu', 'leaderboard guild'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, leaderboard] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!leaderboard) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));

        switch (leaderboard.toLowerCase()) {
            case 'guild': 
            case 'server': {
                const activeMemberIDs = message.channel.guild.members.map(guildMember => `'${guildMember.id}'`);
                const query = `SELECT * FROM profile_xp WHERE discord_id IN (${activeMemberIDs.join(', ')}) ORDER BY xp DESC LIMIT 10;`;
                const result = await KiramekiHelper.query(kirCore.DB, query);
                const userProfile = result.filter(profile => profile.discord_id == message.author.id)[0];
                const topTen = [];

                for (let i = 0; i < result.length; i++) {
                    switch (i) {
                        case 0: {
                            topTen.push(`${KiramekiHelper.emojis.OSU.BEST_PLAYS.FIRST} **${result[i].discord_tag}** is Level **${result[i].level}** and has **${result[i].pats}** Pats.`);
                            break;
                        }

                        case 1: {
                            topTen.push(`${KiramekiHelper.emojis.OSU.BEST_PLAYS.SECOND} **${result[i].discord_tag}** is Level **${result[i].level}** and has **${result[i].pats}** Pats.`);
                            break;
                        }

                        case 2: {
                            topTen.push(`${KiramekiHelper.emojis.OSU.BEST_PLAYS.THIRD} **${result[i].discord_tag}** is Level **${result[i].level}** and has **${result[i].pats}** Pats.`);
                            break;
                        }

                        default: {
                            topTen.push(`➖ **${result[i].discord_tag}** is Level **${result[i].level}** and has **${result[i].pats}** Pats.`);
                            break;
                        }
                    }
                }

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('DEFAULT')
                    .setTitle(`Experience Leaderboards for **__${message.channel.guild.name}__**`)
                    .setThumbnail(message.channel.guild.iconURL)
                    .setDescription(`Currently **${result[0].discord_tag}** is leading in guild **${message.channel.guild.name}** with **${KiramekiHelper.numberWithCommas(result[0].xp)} XP**!`)
                    .addField(`${message.channel.guild.name}'s Top 10 Most Active Users`, topTen.join('\n'))
                    .setFooter(`${userProfile.discord_tag} • Level ${userProfile.level} • ${userProfile.xp} XP • ${userProfile.pats} Pats`, message.author.dynamicAvatarURL('jpg', 16))
                );

                break;
            }

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