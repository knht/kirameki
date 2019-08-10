const KiramekiHelper = require('../../KiramekiHelper');
const ojsama = require('ojsama');

class OsuRecommend {
    constructor() {
        this.name = 'recommend';
        this.aliases = ['osurec', 'rec', 'osurecommend'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Get an osu! Beatmap recommendation either automatically picked for you calculated based off of your top scores and playing habits or by manually specifying map modifiers and or a PP range for maximum customizability.\n\n**Providing a PP range requires providing mods as well! If no mod is wanted, providing `nomod` is still required!**',
            usage: 'recommend [mapModifiers] [ppRange<minPP-maxPP>]',
            example: ['recommend', 'recommend +HDDT', 'recommend +HR 300-450', 'recommend +NoMod 400-500'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, mapMods, ppRange] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const accountLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);

        if (!accountLinkage) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Recommendations', KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `Using osu! Recommendations requires an account linkage!\n\n` +
                    `**Usage:** \`${kirCore.prefix}osusetup <osuName>\`\n\n**Example:** \`${kirCore.prefix}osusetup Riya\``
                )
            );
        }

        message.channel.sendTyping();

        const parsedMods    = (!mapMods) ? 0 : KiramekiHelper.modToNumbers(mapMods);
        const userResults   = await kirCore.osu.user.get(accountLinkage.osu_id, 0, undefined, 'id');
        const ppObject      = { pp: 0 };

        if (!userResults) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Recommendations', accountLinkage.osu_username));
        }

        if (!ppRange) {
            const userBestResults = await kirCore.osu.raw('/get_user_best', { u: accountLinkage.osu_id, m: 0, type: 'id', limit: 10 });

            if (userBestResults.length < 10) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('OSU')
                    .setAuthor('osu! Recommendations', KiramekiHelper.images.OSU_LOGO)
                    .setDescription('In order to use osu! Recommendations you must have at least 10 plays submitted in order for us to reliably calculate your comfortable PP range!')
                );
            }

            for (let userBestResult of userBestResults) {
                ppObject.pp += parseFloat(userBestResult.pp);
            }

            ppObject.min = parseInt((ppObject.pp / userBestResults.length) - 30);
            ppObject.max = parseInt((ppObject.pp / userBestResults.length) + 50);
        } else {
            const ppValues = ppRange.split('-').map(ppValue => parseInt(ppValue));

            if (isNaN(ppValues[0])) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`You can't provide negative PP values ...`)
                );
            }

            if (ppValues.length !== 2) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`Please provide a **valid PP range**! For example: **${ppValues[0]}-${ppValues[0] + 50}**`)
                );
            }

            if (ppValues[1] < ppValues[0] || ppValues[0] === ppValues[1]) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`Your max PP can't be lower than or equal to your min PP!`)
                );
            }

            ppObject.min = ppValues[0];
            ppObject.max = ppValues[1];
        }

        const beatmapQuery = await KiramekiHelper.preparedQuery(
            kirCore.DB, 
            'SELECT * FROM osu_beatmaps_vt WHERE (pp BETWEEN ? AND ?) AND (mods = ?);', 
            [ppObject.min, ppObject.max, parsedMods]
        );

        if (!beatmapQuery.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Recommendations', KiramekiHelper.images.OSU_LOGO)
                .setDescription(`Couldn't find a suitable beatmap to recommend. Please try again.`)
            );
        }

        try {
            const beatmapObject     = KiramekiHelper.getRandomElementFromArray(beatmapQuery);
            const beatmapData       = await kirCore.osu.beatmaps.getByBeatmapId(beatmapObject.beatmap_id);
            const beatmapRender     = `${beatmapData[0].artist} - ${beatmapData[0].title} [${beatmapData[0].version}]`;
            const beatmapMaxCombo   = parseInt(beatmapData[0].max_combo);
            const beatmapMetaData   = await KiramekiHelper.obtainAndCacheOsuFile(beatmapObject.beatmap_id);
            const beatmapParser     = new ojsama.parser();

            beatmapParser.feed(beatmapMetaData);

            const parsedBeatmap = beatmapParser.map;
            const enabledMods   = parseInt(beatmapObject.mods);
            const beatmapStars  = new ojsama.diff().calc({ map: parsedBeatmap, mods: enabledMods });
            const beatmapPP100  = ojsama.ppv2({ stars: beatmapStars, combo: beatmapMaxCombo, nmiss: 0, acc_percent: 100.00 });
            const beatmapPP99   = ojsama.ppv2({ stars: beatmapStars, combo: beatmapMaxCombo, nmiss: 0, acc_percent: 99.00 });
            const beatmapPP97   = ojsama.ppv2({ stars: beatmapStars, combo: beatmapMaxCombo, nmiss: 0, acc_percent: 97.00 });
            const formatted100  = beatmapPP100.toString().split(' ', 1)[0];
            const formatted99   = beatmapPP99.toString().split(' ', 1)[0];
            const formatted97   = beatmapPP97.toString().split(' ', 1)[0];
            const diffIcon      = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(beatmapStars.toString().split(' ', 1)[0]))];
            const usedMods      = (KiramekiHelper.numberToMod(beatmapObject.mods).length > 0) ? `**+${KiramekiHelper.numberToMod(beatmapObject.mods).join(',')}**` : '**Nomod**';

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Recommendations', KiramekiHelper.images.OSU_LOGO)
                .setThumbnail(KiramekiHelper.links.OSU.generateBeatmapThumbnail(beatmapData[0].beatmapset_id))
                .setDescription(`[${beatmapRender}](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(beatmapObject.beatmap_id, beatmapData[0].mode)})`)
                .addField('Mapper', beatmapData[0].creator, true)
                .addField('Artist', beatmapData[0].artist, true)
                .addField('Max Combo',  `${beatmapData[0].max_combo}x`, true)
                .addField('Mods', `${usedMods}`, true)
                .addField('Beatmap Information', `**${beatmapStars.toString().split(' ', 1)[0]}**${diffIcon}Length: **${KiramekiHelper.secToMin(beatmapData[0].total_length)}**, AR: **${beatmapData[0].diff_approach}**, OD: **${beatmapData[0].diff_overall}**, CS: **${beatmapData[0].diff_size}**, BPM: **${beatmapData[0].bpm}**, HP: **${beatmapData[0].diff_drain}**`, false)
                .addField('Performance Points', `**${formatted97}pp** for 97%  •  **${formatted99}pp** for 99%  •  **${formatted100}pp** for 100%`)
                .addField('Download Links', `[osu! Direct](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuDirect(beatmapData[0].beatmapset_id)})  •  [osu! Website](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(beatmapData[0].beatmap_id, beatmapData[0].mode)})  •  [Bloodcat](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaBloodcat(beatmapData[0].beatmapset_id)})`, false)
            );

            KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
            KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, beatmapObject.beatmap_id, message.channel.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! RECOMMENDATIONS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
        } catch (ojsamaError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Something went wrong. Please try again!')
                .setDescription(`If this problem persists please join the [Kirameki support server](${KiramekiHelper.links.INVITE}) and report this bug.`)
            );
            
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'osu! RECOMMENDATIONS', `ojsama Failed to calculate performance points because of: ${ojsamaError}`);
        }
    }
}

module.exports = new OsuRecommend();