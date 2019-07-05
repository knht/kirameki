const KiramekiHelper = require('../../KiramekiHelper');
const countrynames = require('countrynames');
const _ = require('lodash');

class OsuCompare {
    constructor() {
        this.name = 'compare';
        this.aliases = ['c', 'osuc', 'osucompare'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Compares an osu! Standard score to the most recently posted score or beatmap in the same guild channel. Providing a username is optional if an osu! account was linked prior.',
            usage: 'compare [username]',
            example: ['compare', 'compare Mathi', 'compare @Riya#0001'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, username] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);
        let userToLookup;

        if (!username && !userLinkage) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Compare'));
        }

        if (!username) {
            userToLookup = userLinkage.osu_username;
        } else {
            if (message.mentions.length) {
                const mentionedUser = message.mentions[0];
                const mentionedUserLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, mentionedUser.id);

                if (!mentionedUserLinkage) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('OSU')
                        .setAuthor('osu! Compare', KiramekiHelper.images.OSU_LOGO)
                        .setDescription(`The user you have mentioned hasn't linked their osu! account with Kirameki!`)
                    );
                } else {
                    userToLookup = mentionedUserLinkage.osu_username;
                }
            } else {
                userToLookup = username;
            }
        }

        message.channel.sendTyping();

        const latestBeatmapID = await KiramekiHelper.getLatestBMID(kirCore.DB, message.channel.id);

        if (latestBeatmapID === -1) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Compare', KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `It appears there aren't any prior scores posted in this channel. A recent score or beatmap must have been posted in this channel at least once before to compare your scores!`
                )
            );
        }

        const osuUser = await kirCore.osu.user.get(userToLookup, 0, undefined, 'string');

        if (!osuUser) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Compare', userToLookup));
        }

        const osuUsername = osuUser.username;
        const osuUserID = osuUser.user_id;
        const osuUserDisplayName = `:flag_${osuUser.country.toLowerCase()}: ${osuUsername}`;
        const osuUserCountryName = KiramekiHelper.capitalize(countrynames.getName(osuUser.country));
        const userScoreResults = await kirCore.osu.raw('/get_scores', { b: latestBeatmapID, u: osuUserID, m: 0, type: 'id', limit: 100 });

        if (!userScoreResults.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Compare', KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `It appears there aren't any scores set by **${(!username) ? 'you' : userToLookup}** to compare against!`
                )
            );
        }

        const userScoreResultsPre = _.sortBy(userScoreResults, (o) => {
            const v = parseInt(o['pp'], 10);
            return isNaN(v) ? o['pp'] : v;
        });

        const userScoreResultsSanitized = userScoreResultsPre.reverse();
        const userScoreMapData = await kirCore.osu.beatmaps.getByBeatmapId(latestBeatmapID);
        const beatmapSetID = userScoreMapData[0].beatmapset_id;
        const beatmapRender = `${userScoreMapData[0].artist} - ${userScoreMapData[0].title} [${userScoreMapData[0].version}]`;
        const diffIcon = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(userScoreMapData[0].difficultyrating))];

        let collectedScores = [];

        for (let i = 0; i < userScoreResultsSanitized.length; i++) {
            const userScoreResultsRank = KiramekiHelper.emojis.OSU.RANKS[userScoreResultsSanitized[i].rank];
            const usedMods = (KiramekiHelper.numberToMod(userScoreResultsSanitized[i].enabled_mods).length > 0) ? `+${KiramekiHelper.numberToMod(userScoreResultsSanitized[i].enabled_mods).join(',')}` : 'Nomod';
            const accuracy = KiramekiHelper.calculateOsuAccuracy(userScoreResultsSanitized[i]);

            collectedScores.push(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setTitle(`Comparing scores in osu! **Standard** set by **${osuUserDisplayName}**`)
                .setDescription(`[${beatmapRender}](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(latestBeatmapID)})`)
                .setThumbnail(KiramekiHelper.links.OSU.generateBeatmapThumbnail(beatmapSetID))
                .addField(
                    'Play Information',
                    `${parseFloat(userScoreMapData[0].difficultyrating).toFixed(2)}${diffIcon}${userScoreResultsRank} **${accuracy}%** ***${usedMods}*** *(Score: ${KiramekiHelper.numberWithCommas(parseInt(userScoreResultsSanitized[i].score))})*\n` +
                    `**Total Hits:** ` +
                    `${KiramekiHelper.emojis.OSU.HITS[300]} ${userScoreResultsSanitized[0].count300} ` +
                    `${KiramekiHelper.emojis.OSU.HITS[100]} ${userScoreResultsSanitized[0].count100} ` +
                    `${KiramekiHelper.emojis.OSU.HITS[50]} ${userScoreResultsSanitized[0].count50} `   +
                    `${KiramekiHelper.emojis.OSU.HITS.MISS} ${userScoreResultsSanitized[0].countmiss}`
                )
                .addField(
                    'Beatmap Information',
                    `Length: **${KiramekiHelper.secToMin(userScoreMapData[0].total_length)}**, AR: **${userScoreMapData[0].diff_approach}**, OD: **${userScoreMapData[0].diff_overall}**, CS: **${userScoreMapData[0].diff_size}**, BPM: **${userScoreMapData[0].bpm}**, HP: **${userScoreMapData[0].diff_drain}**`
                )
                .addField(
                    'Performance',
                    (!userScoreResultsSanitized[i].pp) ? 'No PP from osu! API' : `**${parseFloat(userScoreResultsSanitized[i].pp).toFixed(2)}pp**`,
                    true
                )
                .addField(
                    'Combo',
                    `**${userScoreResultsSanitized[i].maxcombo}x** / *${userScoreMapData[0].max_combo}x*`,
                    true
                )
                .setTimestamp(`${userScoreResultsSanitized[i].date.replace(' ', 'T')}.000Z`)
                .setFooter(`${osuUsername} #${osuUser.pp_rank} Global, #${osuUser.pp_country_rank} ${osuUserCountryName}`, KiramekiHelper.links.OSU.generateUserThumbnail(osuUserID))
            );
        }

        if (collectedScores.length < 2) {
            message.channel.createEmbed(collectedScores[0]);
        } else {
            KiramekiHelper.PaginationEmbed(message, collectedScores);
        }
        
        KiramekiHelper.updateOsuUser(kirCore.DB, osuUser);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! COMPARE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuCompare();