const KiramekiHelper    = require('../../KiramekiHelper');
const ojsama            = require("ojsama");

class OsuBeatmapFlashcards {
    constructor() {
        this.name = 'osubmfc';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;
        if (message.content.startsWith(kirCore.prefix)) return;
        if (message.content == kirCore.prefix) return;

        try {
            const isEnabled = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_bmlink_cards WHERE channel_id = ?;', [message.channel.id]);

            if (isEnabled.length < 1) return;
            if (!KiramekiHelper.containsBeatmapLink(message.content)) return;

            const beatmapID = KiramekiHelper.getBeatmapIDFromLink(message.content);
            const beatmapData = await kirCore.osu.beatmaps.getByBeatmapId(beatmapID);

            if (beatmapData.length < 1) {
                return message.channel.createEmbed({
                    color: 0xF06DA8,
                    author: {
                        name: 'osu! Beatmap Data',
                        icon_url: KiramekiHelper.images.OSU_LOGO
                    },
                    description: "I have noticed that you linked an osu! Beatmap that hasn't been converted already to the new osu! Beatmap System. Please use the beatmap link of the new osu! Website for those few maps, which still need to be converted by the osu! Staff team."
                });
            }

            const beatmapSetID = beatmapData[0].beatmapset_id;
            const difficultyIcon = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(beatmapData[0].difficultyrating))];
            const beatmapOsuFile = await KiramekiHelper.obtainAndCacheOsuFile(beatmapID);
            const beatmapParser = new ojsama.parser();

            beatmapParser.feed(beatmapOsuFile);

            const ppPossible    = ojsama.ppv2({ map: beatmapParser.map });
            const ppPossibleF   = ppPossible.toString().split(" ", 1)[0];
            
            message.channel.createEmbed({
                color: 0xF06DA8,
                author: {
                    name: 'osu! Beatmap Data',
                    icon_url: KiramekiHelper.images.OSU_LOGO
                },
                thumbnail: {
                    url: `https://b.ppy.sh/thumb/${beatmapSetID}l.jpg?uts=${Math.floor(new Date() / 1000)}`
                },
                fields: [
                    {
                        name: 'Artist',
                        value: beatmapData[0].artist,
                        inline: true
                    },
                    {
                        name: 'Mapper',
                        value: beatmapData[0].creator,
                        inline: true
                    },
                    {
                        name: 'Max Combo',
                        value: beatmapData[0].max_combo,
                        inline: true
                    },
                    {
                        name: 'Max PP',
                        value: `**${ppPossibleF}pp** for 100%`,
                        inline: true
                    },
                    {
                        name: 'Beatmap Title & Difficulty',
                        value: `**${beatmapData[0].title} [${beatmapData[0].version}]**`,
                        inline: false
                    },
                    {
                        name: 'Beatmap Information',
                        value: `**${parseFloat(beatmapData[0].difficultyrating).toFixed(2)}**${difficultyIcon}Length: **${KiramekiHelper.secToMin(beatmapData[0].total_length)}**, AR: **${beatmapData[0].diff_approach}**, OD: **${beatmapData[0].diff_overall}**, CS: **${beatmapData[0].diff_size}**, BPM: **${beatmapData[0].bpm}**, HP: **${beatmapData[0].diff_drain}**`,
                        inline: false
                    },
                    {
                        name: 'Download Links',
                        value: `[osu! Direct](https://kirameki.one/api/osu/osuDirectDownload.php?osu_bms_id=${beatmapSetID})  •  [osu! Website](https://osu.ppy.sh/b/${beatmapID}?m=0)  •  [Bloodcat](https://bloodcat.com/osu/s/${beatmapSetID})`,
                        inline: false
                    }
                ],
                footer: {
                    text: `osu! Beatmap has been posted by: ${message.author.username}`,
                    icon_url: message.author.staticAvatarURL
                }
            });

            const mapObject = {
                mods: 0,
                beatmap_id: beatmapData[0].beatmap_id,
                pp: ppPossibleF,
                beatmapset_id: beatmapData[0].beatmapset_id,
                beatmap_artist: beatmapData[0].artist,
                beatmap_title: beatmapData[0].title,
                beatmap_difficulty: beatmapData[0].version,
                beatmap_length: beatmapData[0].total_length,
                beatmap_bpm: beatmapData[0].bpm,
                beatmap_stars: parseFloat(beatmapData[0].difficultyrating).toFixed(2)
            };
        
            KiramekiHelper.updateOsuBeatmaps(kirCore.DB, mapObject);
            KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, beatmapID, message.channel.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "osu! BMFC", `${KiramekiHelper.userLogCompiler(message.author)} used the Beatmap Flashcards module!`);
        } catch (osuBMFCError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "osu! BMFC ERROR", `Rendering a beatmap flashcard failed because of: ${osuBMFCError}`);
        }
    }
}   

module.exports = new OsuBeatmapFlashcards();