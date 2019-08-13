const KiramekiHelper = require('../../KiramekiHelper');
const owapi = require('owapi');

class Overwatch {
    constructor() {
        this.name = 'overwatch';
        this.aliases = ['owatch', 'overw', 'ow'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.GAMES;
        this.cooldown = 5;
        this.help = {
            message: 'Get up to date stats of an Overwatch player.',
            usage: 'overwatch <battleTag>',
            example: 'overwatch MirroR#11144',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, battlenetTag] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!battlenetTag) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        try {
            const sanitizedBattlenetTag = battlenetTag.replace('#', '-');
            const overwatchResultset = await owapi.getGeneralStats(sanitizedBattlenetTag, 'pc');

            const resultEmbed = new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setAuthor('Overwatch Stats', KiramekiHelper.images.OVERWATCH_LOGO)
                .setThumbnail(overwatchResultset.profile)
                .setDescription('Most recent account stats for following Overwatch player:')
                .addField('BattleTag', `**${battlenetTag.split('#')[0]}**#${battlenetTag.split('#')[1]}`, true)
                .addField('Level', overwatchResultset.level, true)
                .setFooter(`Overwatch player status requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16));

            if (overwatchResultset.rank_name) {
                const overwatchTierIcon = KiramekiHelper.emojis.OVERWATCH.TIERS[overwatchResultset.rank_name.toUpperCase()];

                resultEmbed
                    .addField('Tier', `${overwatchTierIcon} ${KiramekiHelper.capitalize(overwatchResultset.rank_name)}`, true)
                    .addField('Skill Rating', KiramekiHelper.numberWithCommas(overwatchResultset.rank), true);
            }

            message.channel.createEmbed(resultEmbed);
        } catch (overwatchAPIerror) {
            switch (overwatchAPIerror) {
                case 'PLAYER_NOT_EXIST': {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`We couldn't find an Overwatch player with the tag **${battlenetTag}**!`)
                    );

                    break;
                }

                case 'ACCOUNT_PRIVATE': {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`It seems like account **${battlenetTag}** is set to private!`)
                    );

                    break;
                }

                default: {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`Something went wrong processing the result from the Overwatch API!`)
                        .setDescription(`Please try again later. If this problem persists, please join the official [Kirameki support guild](${KiramekiHelper.links.INVITE}) and report this issue!`)
                    );

                    break;
                }
            }

            return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'OVERWATCH API ERROR', `Fetching Data from the Overwatch API failed because of: ${overwatchAPIerror}`);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'OVERWATCH', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Overwatch();