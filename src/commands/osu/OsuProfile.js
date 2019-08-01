const KiramekiHelper = require('../../KiramekiHelper');
const countrynames = require('countrynames');

class OsuProfile {
    constructor() {
        this.name = 'osu';
        this.aliases = ['osuprofile'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 5;
        this.help = {
            message: 'Get a full osu! profile information card together with the Top 3 scores of a player in a game mode specified! Providing an osu! username is optional if a linkage exists.',
            usage: 'osu <mode[std|mania|ctb|taiko]> [username]',
            example: ['osu std', 'osu std @Riya#0001', 'osu std Vaxei', 'osu mania Jakads'],
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, parsedOsuMode, parsedOsuName] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);

        message.channel.sendTyping();

        if (!parsedOsuMode) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        if (!parsedOsuName && !userLinkage) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Profile Lookup'));
        }

        let osuModeCleared;
        let osuModeWritten;
        let osuName;

        switch (parsedOsuMode.toLowerCase()) {
            case 'std':
            case 'standard': {
                osuModeCleared = KiramekiHelper.other.OSU.GAME_MODES.STD;
                osuModeWritten = 'Standard';
                break;
            }

            case 'taiko': {
                osuModeCleared = KiramekiHelper.other.OSU.GAME_MODES.TAIKO;
                osuModeWritten = 'Taiko';
                break;
            }

            case 'ctb':
            case 'catchthebeat': {
                osuModeCleared = KiramekiHelper.other.OSU.GAME_MODES.CTB;
                osuModeWritten = 'Catch The Beat';
                break;
            }

            case 'mania': {
                osuModeCleared = KiramekiHelper.other.OSU.GAME_MODES.MANIA;
                osuModeWritten = 'Mania';
                break;
            }

            default: {
                osuModeCleared = KiramekiHelper.other.OSU.GAME_MODES.STD;
                osuModeWritten = 'Standard';
                break;
            }
        }

        if (parsedOsuName) {
            if (message.mentions.length) {
                const mentionedUser = message.mentions[0];
                const mentionedUserLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, mentionedUser.id);

                if (!mentionedUserLinkage) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor(0xF06DA8)
                        .setAuthor("osu! Profile Lookup", KiramekiHelper.images.OSU_LOGO)
                        .setDescription(
                            "The user you have mentioned hasn't linked their osu! account with Kirameki!"
                        )
                    );
                } else {
                    osuName = mentionedUserLinkage.osu_username;
                }
            } else {
                osuName = parsedOsuName;
            }
        } else {
            osuName = userLinkage.osu_username;
        }

        const userResults = await kirCore.osu.user.get(osuName, osuModeCleared, undefined, 'string');

        if (!userResults) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Profile Lookup', osuName));
        }

        const osuUserID             = userResults.user_id;
        const osuUserRank           = (userResults.pp_rank > 0) ? `#${userResults.pp_rank}` : 'Inactive';
        const osuUserCountryRank    = (userResults.pp_country_rank > 0) ? `#${userResults.pp_country_rank}` : 'Inactive';
        const osuUserAvatarURL      = KiramekiHelper.links.OSU.generateUserThumbnail(userResults.user_id);
        const osuUserDisplayName    = `:flag_${userResults.country.toLowerCase()}: [${userResults.username}](https://osu.ppy.sh/users/${osuUserID})`;
        const osuUserPerformance    = KiramekiHelper.formatPerformancePoints(Math.ceil(userResults.pp_raw));
        const osuUserLevel          = Math.trunc(userResults.level);
        const osuUserAccuracy       = userResults.accuracy;
        
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setAuthor('osu! Player Lookup', KiramekiHelper.images.OSU_LOGO)
            .setDescription(`Account standing in osu! **${osuModeWritten}**`)
            .addBlankField(false)
            .addField('Player Name', osuUserDisplayName, true)
            .addField('Rank', osuUserRank, true)
            .addField('Level', osuUserLevel, true)
            .addField('Country Rank', `${osuUserCountryRank} ${KiramekiHelper.capitalize(countrynames.getName(userResults.country))}`, true)
            .addField('Accuracy', `${(Math.ceil(osuUserAccuracy * 100) / 100).toFixed(2)}%`, true)
            .addField('Performance', (userResults.pp_rank > 0) ? `${osuUserPerformance}pp` : 'Inactive', true)
            .addField('Play Time', KiramekiHelper.secondsToHMS(userResults.total_seconds_played) || 'Unknown', true)
            .addField('Play Count', userResults.playcount, true)
            .addBlankField(false)
            .addField(`Looking for ${userResults.username}'s best plays?`, `Use the \`${kirCore.prefix}top\` command to get detailed information!`)
            .setThumbnail(osuUserAvatarURL)
            .setFooter(`osu! Player Lookup requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! PROFILE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuProfile();