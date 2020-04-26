const KiramekiHelper = require('../../KiramekiHelper');
const ojsama = require('ojsama');

class OsuRecalc {
    constructor() {
        this.name = 'recalc';
        this.aliases = ['osuw', 'osuwith', 'ppcalc', 'osurecalc'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Recalculate the potential PP of a previously posted osu! Standard score or beatmap with custom specifiable accuracy and map modifiers. Providing mods is optional.',
            usage: 'recalc <accuracy>, [mapModifiers]',
            example: ['recalc 99.45%', 'recalc 100% +HD,HR,DT'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, accuracy, mapModifiers] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!accuracy) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const parsedMods        = (mapModifiers) ? mapModifiers : 'nomod';
        const modsToModNumber   = KiramekiHelper.modToNumbers(parsedMods);
        const sanitizedAccuracy = parseFloat(accuracy.replace('%', '').replace(',', '.'));

        if (isNaN(sanitizedAccuracy)) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify a valid accuracy ***before*** specifying map modifiers')
            );
        }

        if (sanitizedAccuracy < KiramekiHelper.other.OSU.ACCURACY.MIN || sanitizedAccuracy > KiramekiHelper.other.OSU.ACCURACY.MAX) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Please specify a valid accuracy ranging from **${KiramekiHelper.other.OSU.ACCURACY.MIN}%** to **${KiramekiHelper.other.OSU.ACCURACY.MAX}%**`)
            );
        }

        const latestBeatmapID = await KiramekiHelper.getLatestBMID(kirCore.DB, message.channel.id);

        if (latestBeatmapID === -1) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Recalc', KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `It appears there aren't any prior scores posted in this channel. A recent score or beatmap must have been posted in this channel at least once before to recalculate performance!`
                )
            );
        }

        const mapData           = await kirCore.osu.beatmaps.getByBeatmapId(latestBeatmapID);
        const beatmapSetID      = mapData[0].beatmapset_id;
        const beatmapRender     = `${mapData[0].artist} - ${mapData[0].title} [${mapData[0].version}]`;
        const usedMods          = (!KiramekiHelper.numberToMod(modsToModNumber).length) ? 'Nomod' : `+${KiramekiHelper.numberToMod(modsToModNumber).join(',')}`;
        const beatmapMaxCombo   = parseInt(mapData[0].max_combo);
        const beatmapMetaData   = await KiramekiHelper.obtainAndCacheOsuFile(latestBeatmapID);
        const beatmapParser     = new ojsama.parser();
        
        beatmapParser.feed(beatmapMetaData);

        const parsedBeatmap = beatmapParser.map;
        const enabledMods   = parseInt(modsToModNumber);
        const accuracy100   = sanitizedAccuracy;
        const beatmapStars  = new ojsama.diff().calc({ map: parsedBeatmap, mods: enabledMods });
        const beatmapPP100  = ojsama.ppv2({ stars: beatmapStars, combo: beatmapMaxCombo, nmiss: 0, acc_percent: accuracy100 });
        const beatmapPPFC   = ojsama.ppv2({ stars: beatmapStars, combo: beatmapMaxCombo, nmiss: 0, acc_percent: 100 });
        const formattedPP   = beatmapPP100.toString().split(' ', 1)[0];
        const beatmapDiff   = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(beatmapStars.toString().split(' ', 1)[0]))];

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setAuthor('osu! Recalc', KiramekiHelper.images.OSU_LOGO)
            .setThumbnail(KiramekiHelper.links.OSU.generateBeatmapThumbnail(beatmapSetID))
            .setDescription(`[${beatmapRender}](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(latestBeatmapID, mapData[0].mode)})`)
            .addField('Mapper', mapData[0].creator, true)
            .addField('Artist', mapData[0].artist, true)
            .addField('Max Combo',  `${mapData[0].max_combo}x`, true)
            .addField('Mods', `**${usedMods}**`, true)
            .addField('Performance Points', `**${formattedPP}pp** for exactly ***${sanitizedAccuracy}%***`)
            .addField('Beatmap Information', `**${beatmapStars.toString().split(' ', 1)[0]}**${beatmapDiff}Length: **${KiramekiHelper.secToMin(mapData[0].total_length)}**, AR: **${mapData[0].diff_approach}**, OD: **${mapData[0].diff_overall}**, CS: **${mapData[0].diff_size}**, BPM: **${mapData[0].bpm}**, HP: **${mapData[0].diff_drain}**`, false)
            .addField('Download Links', `[osu! Direct](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuDirect(beatmapSetID)})  •  [osu! Website](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaOsuWebsite(latestBeatmapID, mapData[0].mode)})  •  [Bloodcat](${KiramekiHelper.links.WEBSITE.API.OSU.BEATMAP_DOWNLOADS.viaBloodcat(beatmapSetID)})`, false)
        );

        const mapObject = {
            mods: modsToModNumber,
            beatmap_id: mapData[0].beatmap_id,
            pp: beatmapPPFC.toString().split(' ', 1)[0],
            beatmapset_id: mapData[0].beatmapset_id,
            beatmap_artist: mapData[0].artist,
            beatmap_title: mapData[0].title,
            beatmap_difficulty: mapData[0].version,
            beatmap_length: mapData[0].total_length,
            beatmap_bpm: mapData[0].bpm,
            beatmap_stars: beatmapStars.toString().split(" ", 1)[0]
        };

        KiramekiHelper.updateOsuBeatmaps(kirCore.DB, mapObject);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! RECALC', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuRecalc();