const KiramekiHelper = require('../../KiramekiHelper');
const ojsama = require('ojsama');

class OsuSearch {
    constructor() {
        this.name = 'search';
        this.aliases = ['osus', 'osusearch'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Search for an osu! Beatmap by its name, artist or difficulty!',
            usage: 'search <beatmapData>',
            example: ['search vickeblanka', 'search freedom dive'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, beatmapData] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!beatmapData) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const beatmapQuery = await KiramekiHelper.preparedQuery(
            kirCore.DB,
            "SELECT * FROM `osu_beatmaps_vt` WHERE CONCAT(LOWER(`beatmap_artist`), LOWER(`beatmap_title`), LOWER(`beatmap_difficulty`)) LIKE LOWER(CONCAT('%', ?, '%')) GROUP BY(`beatmap_id`) LIMIT 30;",
            [beatmapData]
        );

        if (!beatmapQuery.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor(`Couldn't find a beatmap matching your search query. Please try again.`, KiramekiHelper.images.OSU_LOGO)
            );
        }

        const beatmapPicker = await message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setAuthor('osu! Search', KiramekiHelper.images.OSU_LOGO)
            .setDescription(
                `Found **${(beatmapQuery.length > 25) ? '25+' : beatmapQuery.length}** ${(beatmapQuery.length === 1) ? 'Beatmap' : 'Beatmaps'}. Please pick a Beatmap by replying with the corresponding number into the Discord chat:\n\n` +
                KiramekiHelper.formatOsuSearchResults(beatmapQuery).join('\n')
            )
        );

        const filter = (m) => message.author.id === m.author.id;
        const awaitedMessage = await message.channel.awaitMessages(filter, { time: 30000, maxMatches: 1 });

        if (!awaitedMessage[0]) {
            return beatmapPicker.delete();
        }

        const choice = parseInt(awaitedMessage[0].content.replace(/[^0-9\.]+/g, ''));

        if (choice > beatmapQuery.length || choice < 1 || !choice) {
            return beatmapPicker.edit({ embed: new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Invalid numerical choice.`)
            });
        }

        const beatmapID     = beatmapQuery[choice - 1].beatmap_id;
        const beatmapSetID  = beatmapQuery[choice - 1].beatmapset_id;
        const beatmapMeta   = await KiramekiHelper.obtainAndCacheOsuFile(beatmapID);
        const beatmapObject = await kirCore.osu.beatmaps.getByBeatmapId(beatmapID);
        const beatmapRender = `${beatmapObject[0].title || ''} [${beatmapObject[0].version || ''}]`;
        const diffIcon      = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(beatmapObject[0].difficultyrating)];
        const beatmapParser = new ojsama.parser();

        beatmapParser.feed(beatmapMeta);

        const ppPossible = ojsama.ppv2({ map: beatmapParser.map });
        const ppPossibleFormatted = ppPossible.toString().split(' ', 1)[0];

        beatmapPicker.delete();

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setAuthor('osu! Search', KiramekiHelper.images.OSU_LOGO)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapSetID}l.jpg?uts=${Math.floor(new Date() / 1000)}`)
            .addField('Artist', beatmapObject[0].artist, true)
            .addField('Mapper', beatmapObject[0].creator, true)
            .addField('Max Combo', beatmapObject[0].max_combo, true)
            .addField('Max PP', `**${ppPossibleFormatted}pp** for 100%`, true)
            .addField('Beatmap Title & Difficulty', `**${beatmapRender}**`, false)
            .addField(
                'Beatmap Information',
                `**${parseFloat(beatmapObject[0].difficultyrating).toFixed(2)}**${diffIcon}Length: **${KiramekiHelper.secToMin(beatmapObject[0].total_length)}**, AR: **${beatmapObject[0].diff_approach}**, OD: **${beatmapObject[0].diff_overall}**, CS: **${beatmapObject[0].diff_size}**, BPM: **${beatmapObject[0].bpm}**, HP: **${beatmapObject[0].diff_drain}**`,
                false
            )
            .addField(
                'Download Links',
                `[osu! Direct](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuDirect(beatmapSetID)})  •  [osu! Website](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(beatmapID, beatmapObject[0].mode)})  •  [Bloodcat](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaBloodcat(beatmapSetID)})`,
                false
            )
            .setFooter(
                `osu! Beatmap was searched by: ${message.author.username}`,
                message.author.dynamicAvatarURL('jpg', 16)
            )
        );

        KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, beatmapID, message.channel.id);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! SEARCH', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuSearch();