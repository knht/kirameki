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
            message: 'Retrieve a Top 10 best plays list in **osu! Standard** or a specific top play of a user or yourself by specifying the play\'s rank in the Top 100.\n\nListing all Top 10 scores defaults to Standard. You can override the mode by appending one of the mode-flags: `--taiko`, `--mania`, `--ctb` \n\nProviding a username is optional if an account has been linked to Kirameki.',
            usage: 'top [playNumber] [username] [--mode<taiko|mania|ctb>]',
            example: ['top', 'top 17', 'top Mathi', 'top 3 Mathi', 'top --mania', 'top Accalix --taiko'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        let mode = {};
        let newContent;

        if (message.content.toLowerCase().includes('--taiko')) {
            mode.id = 1;
            mode.name = 'Taiko';
            newContent = message.content.slice(0, message.content.toLowerCase().indexOf(' --taiko'));
        } else if (message.content.toLowerCase().includes('--ctb')) {
            mode.id = 2;
            mode.name = 'Catch the Beat';
            newContent = message.content.slice(0, message.content.toLowerCase().indexOf(' --ctb'));
        } else if (message.content.toLowerCase().includes('--mania')) {
            mode.id = 3;
            mode.name = 'Mania';
            newContent = message.content.slice(0, message.content.toLowerCase().indexOf(' --mania'));
        } else {
            mode.id = 0;
            mode.name = 'Standard';
            newContent = (message.content.indexOf(' --') >= 0) ? message.content.slice(0, message.content.indexOf(' --')) : message.content;
        }

        const [command, play, osuName] = KiramekiHelper.tailedArgs(newContent, ' ', 2);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);
        let userToLookup;
        let singleTopPlay = false;

        if (!play && !osuName) {
            if (userLinkage) {
                userToLookup = userLinkage.osu_username;
            } else {
                return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Top'));
            }
        }

        if (play) {
            if (isNaN(play)) {
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
                    userToLookup = play;
                }
            } else {
                if (parseInt(play) < 1 || parseInt(play) > 100) {
                    return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
                }

                singleTopPlay = true;

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
                } else if (userLinkage) {
                    userToLookup = userLinkage.osu_username;
                } else {
                    return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Top'));
                }
            }
        }

        message.channel.sendTyping();

        if (singleTopPlay === true) {
            const osuUser = await kirCore.osu.user.get(userToLookup, 0, undefined, 'string');

            if (!osuUser) {
                return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Top Play', userToLookup));
            }

            const osuUserBest = await kirCore.osu.raw('/get_user_best', { u: osuUser.user_id, m: 0, type: 'id', limit: play });
            
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
        } else {
            const osuUser = await kirCore.osu.user.get(userToLookup, mode.id, undefined, 'string');

            if (!osuUser) {
                return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Top Play', userToLookup));
            }

            const osuUserBest = await kirCore.osu.raw('/get_user_best', { u: osuUser.user_id, m: mode.id, type: 'id', limit: 10 });
            
            if (!osuUserBest.length) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('OSU')
                    .setAuthor(`${osuUser.username} hasn't got enough top plays in mode ${mode.name}!`, KiramekiHelper.images.OSU_LOGO)
                );
            }

            const beatmapIDs = osuUserBest.map((scoreResult) => scoreResult.beatmap_id);
            const beatmapDatabaseResults = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_beatmaps_vt WHERE beatmap_id IN (?) GROUP BY beatmap_id;', [beatmapIDs]);
            const renderedResults = [];

            for (let i = 0; i < osuUserBest.length; i++) {
                const currentMap = beatmapDatabaseResults.find((databaseResult) => databaseResult.beatmap_id == osuUserBest[i].beatmap_id);
                const mapModifiers = (KiramekiHelper.numberToMod(osuUserBest[i].enabled_mods).length > 0) ? `+${KiramekiHelper.numberToMod(osuUserBest[i].enabled_mods).join(',')}` : '';

                if (currentMap) {
                    const beatmapTitleRender = `${currentMap.beatmap_artist} - ${currentMap.beatmap_title} [${currentMap.beatmap_difficulty}]`;

                    if (beatmapTitleRender.length > 60) {
                        renderedResults.push(
                            `${KiramekiHelper.emojis.OSU.RANKS[osuUserBest[i].rank]} **${beatmapTitleRender.substring(0, 30)}**...**${beatmapTitleRender.substring(beatmapTitleRender.length - 30)}** ${mapModifiers}\n➖ ${KiramekiHelper.calculateOsuAccuracy(osuUserBest[i])}%  •  ${osuUserBest[i].maxcombo}x  •  ${osuUserBest[i].countmiss} ${(parseInt(osuUserBest[i].countmiss) === 1) ? 'miss' : 'misses'}  •  ${(!osuUserBest[i].pp) ? 'No PP from osu! API' : `**${parseFloat(osuUserBest[i].pp).toFixed(2)}pp**`}`
                        );
                    } else {
                        renderedResults.push(
                            `${KiramekiHelper.emojis.OSU.RANKS[osuUserBest[i].rank]} **${beatmapTitleRender}** ${mapModifiers}\n➖ ${KiramekiHelper.calculateOsuAccuracy(osuUserBest[i])}%  •  ${osuUserBest[i].maxcombo}x  •  ${osuUserBest[i].countmiss} ${(parseInt(osuUserBest[i].countmiss) === 1) ? 'miss' : 'misses'}  •  ${(!osuUserBest[i].pp) ? 'No PP from osu! API' : `**${parseFloat(osuUserBest[i].pp).toFixed(2)}pp**`}`
                        );
                    }
                } else {
                    renderedResults.push(
                        `${KiramekiHelper.emojis.OSU.RANKS[osuUserBest[i].rank]} **Unknown Artist - Unknown Map [???]** ${mapModifiers}\n➖ ${KiramekiHelper.calculateOsuAccuracy(osuUserBest[i])}%  •  ${osuUserBest[i].maxcombo}x  •  ${osuUserBest[i].countmiss} ${(parseInt(osuUserBest[i].countmiss) === 1) ? 'miss' : 'misses'}  •  ${(!osuUserBest[i].pp) ? 'No PP from osu! API' : `**${parseFloat(osuUserBest[i].pp).toFixed(2)}pp**`}`
                    );
                }
            }

            const osuUserDisplayname = `:flag_${osuUser.country.toLowerCase()}: ${osuUser.username}`;

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setTitle(`**Top 10** best scores in osu! **${mode.name}** set by **${osuUserDisplayname}**`)
                .setDescription(renderedResults.join('\n\n'))
                .setFooter(`${osuUser.username} #${osuUser.pp_rank} Global, #${osuUser.pp_country_rank} ${KiramekiHelper.capitalize(countryNames.getName(osuUser.country))}`, `https://a.ppy.sh/${osuUser.user_id}?uts=${Math.floor(new Date() / 1000)}`)
            );

            KiramekiHelper.updateOsuUser(kirCore.DB, osuUser);
            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! TOP', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
        }
    }
}

module.exports = new OsuTop();