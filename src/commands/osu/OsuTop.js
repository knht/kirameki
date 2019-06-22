const KiramekiHelper = require('../../KiramekiHelper');
const countryNames = require('countrynames');

class OsuTop {
    constructor() {
        this.name = 'top';
        this.aliases = ['osutop', 'topplay'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Retrieve a specific top play of a user or yourself by specifying the play\'s rank in the top 100. Providing a username is optional if an account has been linked to Kirameki.',
            usage: 'top <playNumber> [username]',
            example: ['top 3', 'top 1 Mathi', 'top 87 nathan on osu'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, play, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);
        let userToLookup;

        if (!play || isNaN(play) || parseInt(play) < 1 || parseInt(play) > 100) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        if (!osuName && !userLinkage) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Top'));
        }

        if (osuName) {
            if (message.mentions.length) {
                const mentionedUser = message.mentions[0];
                const mentionedUserLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, mentionedUser.id);

                if (!mentionedUserLinkage) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('OSU')
                        .setAuthor("osu! Top Play", KiramekiHelper.images.OSU_LOGO)
                        .setDescription(
                            "The user you have mentioned hasn't linked their osu! account with Kirameki!"
                        )
                    );
                } else {
                    userToLookup = mentionedUserLinkage.osu_username;
                }
            } else {
                userToLookup = osuName;
            }
        } else {
            userToLookup = userLinkage.osu_username;
        }

        message.channel.sendTyping();

        const osuUser = await kirCore.osu.user.get(userToLookup, 0, undefined, 'string');

        if (!osuUser) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Top Play', userToLookup));
        }

        const osuUserBest = await kirCore.osu.raw('/get_user_best', { u: osuUser.user_id, m: 0, type: 'id', limit: play  });
        
        if (!osuUserBest.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor(`This top play does not exist in ${osuUser.username}'s Top 100!`, KiramekiHelper.images.OSU_LOGO)
            );
        }

        const osuUserBestObject = osuUserBest[play - 1];
        const osuBestMap = await kirCore.osu.beatmaps.getByBeatmapId(osuUserBestObject.beatmap_id);

        if (!osuBestMap.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor(`Couldn't find the beatmap for ${osuUser.username}'s top ${play} play`, KiramekiHelper.images.OSU_LOGO)
            );
        }

        const osuBestMapObject = osuBestMap[0];
        const beatmapRender = `${osuBestMapObject.artist} - ${osuBestMapObject.title} [${osuBestMapObject.version}]`;
        const osuUserDisplayname = `:flag_${osuUser.country.toLowerCase()}: ${osuUser.username}`;
        const diffIcon = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(osuBestMapObject.difficultyrating))];
        const userScoreResultsRank = KiramekiHelper.emojis.OSU.RANKS[osuUserBestObject.rank];
        const usedMapModifiers = (KiramekiHelper.numberToMod(osuUserBestObject.enabled_mods).length > 0) ? `+${KiramekiHelper.numberToMod(osuUserBestObject.enabled_mods).join(',')}` : 'Nomod';
        const userCountryName = KiramekiHelper.capitalize(countryNames.getName(osuUser.country));
        const formattedCalcAcc = KiramekiHelper.calculateOsuAccuracy(osuUserBestObject);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setTitle(`**Top ${play}** best score in osu! **Standard** set by **${osuUserDisplayname}**`)
            .setDescription(`[${beatmapRender}](https://osu.ppy.sh/b/${osuBestMapObject.beatmap_id}&m=0)`)
            .setColor('OSU')
            .setTimestamp(`${osuUserBestObject.date.replace(' ', 'T')}.000Z`)
            .setThumbnail(`https://b.ppy.sh/thumb/${osuBestMapObject.beatmapset_id}l.jpg?uts=${Math.floor(new Date() / 1000)}`)
            .addField(
                'Play Information',
                `${parseFloat(osuBestMapObject.difficultyrating).toFixed(2)}${diffIcon}${userScoreResultsRank} **${formattedCalcAcc}%** ***${usedMapModifiers}*** *(Score: ${KiramekiHelper.numberWithCommas(parseInt(osuUserBestObject.score))})*\n` +
                `**Total Hits:** ` +
                `${KiramekiHelper.emojis.OSU.HITS[300]} ${osuUserBestObject.count300} ` +
                `${KiramekiHelper.emojis.OSU.HITS[100]} ${osuUserBestObject.count100} ` +
                `${KiramekiHelper.emojis.OSU.HITS[50]} ${osuUserBestObject.count50} `   +
                `${KiramekiHelper.emojis.OSU.HITS.MISS} ${osuUserBestObject.countmiss}`
            )
            .addField(
                'Beatmap Information',
                `Length: **${KiramekiHelper.secToMin(osuBestMapObject.total_length)}**, AR: **${osuBestMapObject.diff_approach}**, OD: **${osuBestMapObject.diff_overall}**, CS: **${osuBestMapObject.diff_size}**, BPM: **${osuBestMapObject.bpm}**, HP: **${osuBestMapObject.diff_drain}**`
            )
            .addField(
                'Performance',
                (!osuUserBestObject.pp) ? 'No PP from osu! API' : `**${parseFloat(osuUserBestObject.pp).toFixed(2)}pp**`,
                true
            )
            .addField(
                'Combo',
                `**${osuUserBestObject.maxcombo}x** / *${osuBestMapObject.max_combo}x*`,
                true
            )
            .setFooter(`${osuUser.username} #${osuUser.pp_rank} Global, #${osuUser.pp_country_rank} ${userCountryName}`, `https://a.ppy.sh/${osuUser.user_id}?uts=${Math.floor(new Date() / 1000)}`)
        );

        const mapObject = {
            mods: osuUserBestObject.enabled_mods,
            beatmap_id: osuBestMapObject.beatmap_id,
            pp: parseFloat(osuUserBestObject.pp).toFixed(2),
            beatmapset_id: osuBestMapObject.beatmapset_id,
            beatmap_artist: osuBestMapObject.artist,
            beatmap_title: osuBestMapObject.title,
            beatmap_difficulty: osuBestMapObject.version,
            beatmap_length: osuBestMapObject.total_length,
            beatmap_bpm: osuBestMapObject.bpm,
            beatmap_stars: parseFloat(osuBestMapObject.difficultyrating).toFixed(2)
        };

        KiramekiHelper.updateOsuBeatmaps(kirCore.DB, mapObject);
        KiramekiHelper.updateOsuUser(kirCore.DB, osuUser);
        KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, osuBestMapObject.beatmap_id, message.channel.id);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! TOP', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuTop();