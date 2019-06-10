const KiramekiHelper    = require('../../KiramekiHelper');
const KiramekiConfig    = require('../../../config/KiramekiConfig');
const countrynames      = require('countrynames');
const chalk             = require('chalk');
const ojsama            = require('ojsama');

class OsuRecent {
    constructor() {
        this.category = KiramekiHelper.categories.OSU;
        this.name = 'recent';
        this.aliases = ['osurecent', 'osur', 'r'];
        this.permissions = ['externalEmojis'];
        this.help = {
            message: 'Get the most recent osu! Standard play for yourself or a specified player.\nSpecifying a username is optional if an osu! Linkage exists.',
            usage: 'r [username]',
            example: ['r', 'r Riya', 'r @Riya#0001']
        }
    }

    async execute(message, kirCore) {
        message.channel.sendTyping();

        const [command, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);
        let userToLookup;

        if (!osuName && !userLinkage) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Most Recent", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    "You haven't provided an osu! username! Please link your osu! account with your Discord account or provide a username!\n\n**Usage:** `&osusetup <osuName>`\n\n**Example:** `&osusetup Riya`"
                )
            );
        }
        
        if (osuName) {
            if (message.mentions.length) {
                const mentionedUser = message.mentions[0];
                const mentionedUserLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, mentionedUser.id);

                if (!mentionedUserLinkage) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor(0xF06DA8)
                        .setAuthor("osu! Most Recent", KiramekiHelper.images.OSU_LOGO)
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

        try {
            const userResults = await kirCore.osu.user.get(userToLookup, 0, undefined, 'string');
            const osuUsername = userResults.username;
            const osuUserID = userResults.user_id;
            const osuUserDisplayname = ':flag_' + userResults.country.toLowerCase() + ': ' + userResults.username;
            const userWrittenName = countrynames.getName(userResults.country).charAt(0).toUpperCase() + countrynames.getName(userResults.country).slice(1).toLowerCase();

            try {
                const userRecentResults = await kirCore.osu.raw('/get_user_recent', { u: osuUserID, m: 0, type: 'id', limit: 1 });
                const mostRecentRank = KiramekiHelper.emojis.OSU.RANKS[userRecentResults[0].rank];
                const mostRecentBMID = userRecentResults[0].beatmap_id;

                try {
                    const userRecentScore = await kirCore.osu.beatmaps.getByBeatmapId(mostRecentBMID);
                    const beatmapSetID = userRecentScore[0].beatmapset_id;
                    const beatmapRender = userRecentScore[0].artist + " - " + userRecentScore[0].title + " [" + userRecentScore[0].version + "]";
                    const mostRecentDiffIcon = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(userRecentScore[0].difficultyrating))];
                    const beatmapData = await KiramekiHelper.obtainAndCacheOsuFile(mostRecentBMID);

                    let beatmapParser = new ojsama.parser();
                    beatmapParser.feed(beatmapData);
                    let beatmapMap = beatmapParser.map;
                    let enabledMods = parseInt(userRecentResults[0].enabled_mods);
                    let beatmapStars = new ojsama.diff().calc({ map: beatmapMap, mods: enabledMods });
                    let recentMaxCombo = parseInt(userRecentResults[0].maxcombo);
                    let recentMisses = parseInt(userRecentResults[0].countmiss);

                    let recentAccuracy = parseFloat((((
                        (parseInt(userRecentResults[0].count300)  * 300) +
                        (parseInt(userRecentResults[0].count100)  * 100) +
                        (parseInt(userRecentResults[0].count50)   * 50)  +
                        (parseInt(userRecentResults[0].countmiss) * 0))  /
                        ((
                            parseInt(userRecentResults[0].count300)      +
                            parseInt(userRecentResults[0].count100)      +
                            parseInt(userRecentResults[0].count50)       +
                            parseInt(userRecentResults[0].countmiss)
                        ) * 300)) * 100));

                    let recentAccuracyForFC = parseFloat((((
                        (parseInt(userRecentResults[0].count300) * 300)  +
                        ((parseInt(userRecentResults[0].count100) + parseInt(userRecentResults[0].countmiss)) * 100) +
                        (parseInt(userRecentResults[0].count50) * 50)    +
                        (parseInt(0) * 0)) /
                        ((
                            parseInt(userRecentResults[0].count300)      +
                            parseInt(userRecentResults[0].count100)      +
                            parseInt(userRecentResults[0].count50)       +
                            parseInt(userRecentResults[0].countmiss)
                        ) * 300)) * 100));

                    let beatmapPP = ojsama.ppv2({ stars: beatmapStars, combo: recentMaxCombo, nmiss: recentMisses, acc_percent: recentAccuracy });
                    let maxPPPossible = ojsama.ppv2({ map: beatmapMap, stars: beatmapStars });
                    let beatmapACCPP = ojsama.ppv2({ stars: beatmapStars, combo: parseInt(beatmapMap.max_combo()), nmiss: 0, acc_percent: recentAccuracyForFC });
                    let potentialPP = beatmapACCPP.toString().split(" ", 1)[0];
                    let max_combo = beatmapMap.max_combo();
                    let formattedCalcAcc = beatmapPP.computed_accuracy.toString().split("%", 1)[0];
                    let formattedPPmin = beatmapPP.toString().split(" ", 1)[0];
                    let formattedPPMax = maxPPPossible.toString().split(" ", 1)[0];
                    let mapModifiers = (KiramekiHelper.numberToMod(userRecentResults[0].enabled_mods).length > 0) ? "+" + KiramekiHelper.numberToMod(userRecentResults[0].enabled_mods).join(',') : "Nomod";
                    let allHits = parseInt(userRecentResults[0].count50) + parseInt(userRecentResults[0].count100) + parseInt(userRecentResults[0].count300) + parseInt(userRecentResults[0].countmiss);
                    let mapCompletion = parseFloat(KiramekiHelper.getMapCompletion(beatmapData, allHits)).toFixed(2) + '%';

                    message.channel.createEmbed({
                        title: "Most recent play in osu! **Standard** by **" + osuUserDisplayname + "**",
                        description: "[" + beatmapRender + "](https://osu.ppy.sh/b/" + mostRecentBMID + "&m=0)",
                        color: 0xF06DA8,
                        timestamp: userRecentResults[0].date.replace(' ', 'T') + '.000Z',
                        thumbnail: {
                            url: "https://b.ppy.sh/thumb/" + beatmapSetID + "l.jpg?uts=" + Math.floor(new Date() / 1000)
                        },
                        fields: [{
                            name: "Play Information",
                            value: beatmapStars.toString().split(" ", 1)[0] + mostRecentDiffIcon + mostRecentRank + " **" + formattedCalcAcc + "%** ***" + mapModifiers + "*** *(Score: " + KiramekiHelper.numberWithCommas(parseInt(userRecentResults[0].score)) + ")*\n" +
                                "**Total Hits:** " +
                                `${KiramekiHelper.emojis.OSU.HITS[300]} ${userRecentResults[0].count300} ` +
                                `${KiramekiHelper.emojis.OSU.HITS[100]} ${userRecentResults[0].count100} ` +
                                `${KiramekiHelper.emojis.OSU.HITS[50]} ${userRecentResults[0].count50} ` +
                                `${KiramekiHelper.emojis.OSU.HITS.MISS} ${userRecentResults[0].countmiss}`
                        },
                        {
                            name: "Beatmap Information",
                            value: "Length: **" + KiramekiHelper.secToMin(userRecentScore[0].total_length) + "**, AR: **" + userRecentScore[0].diff_approach + "**, OD: **" + userRecentScore[0].diff_overall + "**, CS: **" + userRecentScore[0].diff_size + "**, BPM: **" + userRecentScore[0].bpm + "**, HP: **" + userRecentScore[0].diff_drain + "**"
                        },
                        {
                            name: "Performance",
                            value: "**" + formattedPPmin + "pp** / *" + formattedPPMax + "pp*",
                            inline: true
                        },
                        {
                            name: "Combo",
                            value: "**" + userRecentResults[0].maxcombo + "x** / *" + max_combo + "x*",
                            inline: true
                        },
                        {
                            name: "Potential Performance",
                            value: "**" + potentialPP + "pp** for **" + recentAccuracyForFC.toFixed(2) + "%**",
                            inline: true
                        },
                        {
                            name: "Map Completion",
                            value: "**" + mapCompletion + "**",
                            inline: true
                        }
                        ],
                        footer: {
                            icon_url: 'https://a.ppy.sh/' + userResults.user_id + '?uts=' + Math.floor(new Date() / 1000),
                            text: osuUsername + " #" + userResults.pp_rank + " Global, #" + userResults.pp_country_rank + " " + userWrittenName
                        }
                    });

                    const mapObject = {
                        mods: userRecentResults[0].enabled_mods,
                        beatmap_id: userRecentScore[0].beatmap_id,
                        pp: formattedPPMax,
                        beatmapset_id: userRecentScore[0].beatmapset_id,
                        beatmap_artist: userRecentScore[0].artist,
                        beatmap_title: userRecentScore[0].title,
                        beatmap_difficulty: userRecentScore[0].version,
                        beatmap_length: userRecentScore[0].total_length,
                        beatmap_bpm: userRecentScore[0].bpm,
                        beatmap_stars: beatmapStars.toString().split(" ", 1)[0]
                    };

                    KiramekiHelper.updateOsuBeatmaps(kirCore.DB, mapObject);
                    KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
                    KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, mostRecentBMID, message.channel.id);
                    KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! RECENTS", `${KiramekiHelper.userLogCompiler(message.author)} checked recent plays for osu! user ${chalk.bold(userToLookup)}!`);
                } catch (beatmapFetchError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor(0xF06DA8)
                        .setAuthor("osu! Most Recent", KiramekiHelper.images.OSU_LOGO)
                        .setDescription(
                            "Something went wrong while calculating your potential PP. This could very well be because the osu! beatmap data API is currently down or in bad state. Please check **@osustatus** on Twitter if this problem persists."
                        )
                    );

                    KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "osu! RECENTS ERROR", `Recents failed because of ojsama not being able to calculate PP. Reason: ${chalk.bold(beatmapFetchError)}!`);
                    console.error(beatmapFetchError);
                }
            } catch (osuNoRecentsError) {
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor(0xF06DA8)
                    .setAuthor("osu! Most Recent", KiramekiHelper.images.OSU_LOGO)
                    .setDescription(
                        `There are no recent plays for user **${userToLookup}**`
                    )
                );

                KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
                KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! RECENTS", `Recents failed because there are no recent plays for the player looking for!`);
            }
        } catch (osuUserFetchError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Player Lookup", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    "***We couldn't find the user you were looking for. (" + userToLookup + ")***\n\n" +
                    "There are a few possible reasons for this:\n\n" +
                    "*• They may have changed their username.*\n" +
                    "*• The account may be temporarily unavailable.*\n" +
                    "*• You may have made a typo!*\n"
                )
                .setThumbnail(KiramekiHelper.images.OSU_PIPPI_SAD)
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! RECENTS LOOKUP", `Fetching the user from the osu! API failed because of: ${chalk.bold(osuUserFetchError)}`);
        }
    }
}

module.exports = new OsuRecent();