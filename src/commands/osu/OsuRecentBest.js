const KiramekiHelper = require('../../KiramekiHelper');
const countrynames      = require('countrynames');
const chalk             = require('chalk');
const ojsama            = require('ojsama');
const uniqid            = require('uniqid');

class OsuRecentBest {
    constructor() {
        this.name = 'recentbest';
        this.aliases = ['osurb', 'rb'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Retrieve the ***best*** **most recent** play in osu! Standard including map completion and PP calculations! Providing an osu! username is optional if a linkage exists.',
            usage: 'recentbest [username]',
            example: ['recentbest', 'recentbest FlyingTuna', 'recentbest @Riya#0001'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);
        let userToLookup;

        if (!osuName && !userLinkage) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Best Most Recent'));
        }
        
        message.channel.sendTyping();

        if (osuName) {
            if (message.mentions.length) {
                const mentionedUser = message.mentions[0];
                const mentionedUserLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, mentionedUser.id);

                if (!mentionedUserLinkage) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor(0xF06DA8)
                        .setAuthor("osu! Best Most Recent", KiramekiHelper.images.OSU_LOGO)
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

        const userResults = await kirCore.osu.user.get(userToLookup, 0, undefined, 'string');

        if (!userResults) {
            message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Best Most Recent', userToLookup));
            return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! BEST RECENTS LOOKUP", `Fetching the user from the osu! API failed because of: ${chalk.bold('User Not Found!')}`);
        }

        const osuUsername           = userResults.username;
        const osuUserID             = userResults.user_id;
        const osuUserDisplayname    = ':flag_' + userResults.country.toLowerCase() + ': ' + userResults.username;
        const userWrittenName       = countrynames.getName(userResults.country).charAt(0).toUpperCase() + countrynames.getName(userResults.country).slice(1).toLowerCase();
        const userBestRecentResults = await kirCore.osu.raw('/get_user_best', { u: osuUserID, m: 0, type: 'id', limit: 100 });

        if (!userBestRecentResults.length) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Best Most Recent", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `There aren't enough Top 100 plays for user **${userToLookup}**`
                )
            );

            KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
            return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! BEST RECENTS", `Best Most Recents failed because there aren't enough Top 100 plays for the player looking for!`);
        }

        userBestRecentResults.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            return dateA - dateB;
        }).reverse();

        const mostRecentRank = KiramekiHelper.emojis.OSU.RANKS[userBestRecentResults[0].rank];
        const mostRecentBMID = userBestRecentResults[0].beatmap_id;

        try {
            const userBestRecentScore   = await kirCore.osu.beatmaps.getByBeatmapId(mostRecentBMID);
            const beatmapSetID          = userBestRecentScore[0].beatmapset_id;
            const beatmapRender         = userBestRecentScore[0].artist + " - " + userBestRecentScore[0].title + " [" + userBestRecentScore[0].version + "]";
            const mostRecentDiffIcon    = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(userBestRecentScore[0].difficultyrating))];
            const beatmapData           = await KiramekiHelper.obtainAndCacheOsuFile(mostRecentBMID);

            let beatmapParser   = new ojsama.parser();
                beatmapParser.feed(beatmapData);
            let beatmapMap      = beatmapParser.map;
            let enabledMods     = parseInt(userBestRecentResults[0].enabled_mods);
            let beatmapStars    = new ojsama.diff().calc({ map: beatmapMap, mods: enabledMods });
            let recentMaxCombo  = parseInt(userBestRecentResults[0].maxcombo);
            let recentMisses    = parseInt(userBestRecentResults[0].countmiss);
            let recentAccuracy  = parseFloat((((
                (parseInt(userBestRecentResults[0].count300)  * 300) +
                (parseInt(userBestRecentResults[0].count100)  * 100) +
                (parseInt(userBestRecentResults[0].count50)   * 50)  +
                (parseInt(userBestRecentResults[0].countmiss) * 0))  /
                ((
                    parseInt(userBestRecentResults[0].count300)      +
                    parseInt(userBestRecentResults[0].count100)      +
                    parseInt(userBestRecentResults[0].count50)       +
                    parseInt(userBestRecentResults[0].countmiss)
                ) * 300)) * 100));

            let recentAccuracyForFC = parseFloat((((
                (parseInt(userBestRecentResults[0].count300)  * 300) +
                ((parseInt(userBestRecentResults[0].count100) + parseInt(userBestRecentResults[0].countmiss)) * 100) +
                (parseInt(userBestRecentResults[0].count50)   * 50)  +
                (parseInt(0) * 0)) /
                ((
                    parseInt(userBestRecentResults[0].count300)      +
                    parseInt(userBestRecentResults[0].count100)      +
                    parseInt(userBestRecentResults[0].count50)       +
                    parseInt(userBestRecentResults[0].countmiss)
                ) * 300)) * 100));

            let beatmapPP           = ojsama.ppv2({ stars: beatmapStars, combo: recentMaxCombo, nmiss: recentMisses, acc_percent: recentAccuracy });
            let maxPPPossible       = ojsama.ppv2({ map: beatmapMap, stars: beatmapStars });
            let beatmapACCPP        = ojsama.ppv2({ stars: beatmapStars, combo: parseInt(beatmapMap.max_combo()), nmiss: 0, acc_percent: recentAccuracyForFC });
            let potentialPP         = beatmapACCPP.toString().split(" ", 1)[0];
            let max_combo           = beatmapMap.max_combo();
            let formattedCalcAcc    = beatmapPP.computed_accuracy.toString().split("%", 1)[0];
            let formattedPPmin      = beatmapPP.toString().split(" ", 1)[0];
            let formattedPPMax      = maxPPPossible.toString().split(" ", 1)[0];
            let mapModifiers        = (KiramekiHelper.numberToMod(userBestRecentResults[0].enabled_mods).length > 0) ? "+" + KiramekiHelper.numberToMod(userBestRecentResults[0].enabled_mods).join(',') : "Nomod";
            let allHits             = parseInt(userBestRecentResults[0].count50) + parseInt(userBestRecentResults[0].count100) + parseInt(userBestRecentResults[0].count300) + parseInt(userBestRecentResults[0].countmiss);
            let mapCompletion       = parseFloat(KiramekiHelper.getMapCompletion(beatmapData, allHits)).toFixed(2) + '%';

            message.channel.createEmbed({
                title: "**Best** recent play in osu! **Standard** by **" + osuUserDisplayname + "**",
                description: "[" + beatmapRender + "](https://osu.ppy.sh/b/" + mostRecentBMID + "&m=0)",
                color: 0xF06DA8,
                timestamp: userBestRecentResults[0].date.replace(' ', 'T') + '.000Z',
                thumbnail: {
                    url: "https://b.ppy.sh/thumb/" + beatmapSetID + "l.jpg?uts=" + Math.floor(new Date() / 1000)
                },
                fields: [{
                    name: "Play Information",
                    value: beatmapStars.toString().split(" ", 1)[0] + mostRecentDiffIcon + mostRecentRank + " **" + formattedCalcAcc + "%** ***" + mapModifiers + "*** *(Score: " + KiramekiHelper.numberWithCommas(parseInt(userBestRecentResults[0].score)) + ")*\n" +
                        "**Total Hits:** " +
                        `${KiramekiHelper.emojis.OSU.HITS[300]} ${userBestRecentResults[0].count300} ` +
                        `${KiramekiHelper.emojis.OSU.HITS[100]} ${userBestRecentResults[0].count100} ` +
                        `${KiramekiHelper.emojis.OSU.HITS[50]} ${userBestRecentResults[0].count50} ` +
                        `${KiramekiHelper.emojis.OSU.HITS.MISS} ${userBestRecentResults[0].countmiss}`
                },
                {
                    name: "Beatmap Information",
                    value: `Length: **${KiramekiHelper.secToMin(userBestRecentScore[0].total_length)}**, AR: **${userBestRecentScore[0].diff_approach}**, OD: **${userBestRecentScore[0].diff_overall}**, CS: **${userBestRecentScore[0].diff_size}**, BPM: **${userBestRecentScore[0].bpm}**, HP: **${userBestRecentScore[0].diff_drain}**`
                },
                {
                    name: "Performance",
                    value: "**" + formattedPPmin + "pp** / *" + formattedPPMax + "pp*",
                    inline: true
                },
                {
                    name: "Combo",
                    value: "**" + userBestRecentResults[0].maxcombo + "x** / *" + max_combo + "x*",
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
                mods: userBestRecentResults[0].enabled_mods,
                beatmap_id: userBestRecentScore[0].beatmap_id,
                pp: formattedPPMax,
                beatmapset_id: userBestRecentScore[0].beatmapset_id,
                beatmap_artist: userBestRecentScore[0].artist,
                beatmap_title: userBestRecentScore[0].title,
                beatmap_difficulty: userBestRecentScore[0].version,
                beatmap_length: userBestRecentScore[0].total_length,
                beatmap_bpm: userBestRecentScore[0].bpm,
                beatmap_stars: beatmapStars.toString().split(" ", 1)[0]
            };

            KiramekiHelper.updateOsuBeatmaps(kirCore.DB, mapObject);
            KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
            KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, mostRecentBMID, message.channel.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "osu! BEST RECENTS", `${KiramekiHelper.userLogCompiler(message.author)} checked best recent plays for osu! user ${chalk.bold(userToLookup)}!`);
        } catch (beatmapFetchError) {
            const bugIdentifier = uniqid();

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Best Most Recent", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `Something went wrong while calculating your potential PP. This could very well be because the osu! beatmap data API is currently down or in bad state. Please check **@osustatus** on Twitter or join the [official Kirameki support server](${KiramekiHelper.links.INVITE}) and report a bug if this problem persists.\n\nPlease provide following code: **${bugIdentifier}**`
                )
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "osu! BEST RECENTS ERROR", `[ ${bugIdentifier} ] Recents failed because of ojsama not being able to calculate PP. Reason: ${chalk.bold(beatmapFetchError)}!`);
            console.error(beatmapFetchError);
        }
    }
}

module.exports = new OsuRecentBest();