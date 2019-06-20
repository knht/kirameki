const KiramekiHelper = require('../../KiramekiHelper');
const getUrls = require('get-urls');
const uniqid = require('uniqid');
const jimp = require('jimp');
const stringSimilarity = require('string-similarity');
const countrynames = require('countrynames');

class OsuScoreScreensOCR {
    constructor() {
        this.name = 'osussocr';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;
        if (message.content.startsWith(kirCore.prefix)) return;
        if (message.content === kirCore.prefix) return;

        try {
            const isEnabled = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_channel_ocr WHERE channel_id = ?;', [message.channel.id]);
            const isLinked  = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_discord_links WHERE discord_id = ? LIMIT 1;', [message.author.id]);

            if (!isEnabled.length || !isLinked.length) return;
            if (!KiramekiHelper.hasValidOsuScreenshot(message.content)) return;

            const osuScreenshotUrl  = getUrls(message.content).values().next().value;
            const temporaryFilePath = `ocr/${uniqid()}.jpg`;
            const checking          = await message.channel.createEmbed(new KiramekiHelper.Embed().setColor('GREEN').setTitle('Scanning for osu! Screenshot ...'));
            const enhancedImage     = await jimp.read(osuScreenshotUrl);

            enhancedImage.crop(0, 0, (enhancedImage.bitmap.width * 0.7), (enhancedImage.bitmap.height * 0.12));
            enhancedImage.contrast(0.75).greyscale().color([{ apply: 'darken', params: [-10] }]).write(temporaryFilePath);

            const textResult        = await KiramekiHelper.asyncTesseract(temporaryFilePath);
            const parsedUsername    = textResult.split('Played by ')[1].split(' on')[0];
            const playName          = textResult.split('\n')[0];
            const mapArtist         = playName.split(" - ")[0];
            const mapTitle          = playName.split(" - ")[1].split(" [")[0];
            const mapVersion        = playName.split(" - ")[1].split(" [")[1].split("]")[0];
            const linkageUsername   = isLinked[0].osu_username;
            const nameProbability   = parseFloat(stringSimilarity.compareTwoStrings(linkageUsername, parsedUsername)) * 100;

            if (nameProbability < 75) {
                checking.delete();
                return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'osu! OCR ERROR', `Name probability too bad: ${nameProbability}% -> ${parsedUsername} (${linkageUsername})`);
            }

            const getBeatmapObject = await KiramekiHelper.preparedQuery(
                kirCore.DB, 
                'SELECT * FROM osu_beatmaps_vt WHERE SOUNDEX(beatmap_artist) = SOUNDEX(?) AND SOUNDEX(beatmap_title) = SOUNDEX(?) AND SOUNDEX(beatmap_difficulty) = SOUNDEX(?) LIMIT 1;', 
                [mapArtist, mapTitle, mapVersion]
            );

            if (!getBeatmapObject.length) {
                checking.edit({ embed: new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`Beatmap isn't cached in the Kirameki database yet`)
                    .setDescription('You can manually force cache a map to the database by posting the beatmap link into the Discord chat.') 
                });

                return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'osu! OCR ERROR', `Map isn't cached in database yet.`);
            }

            const beatmapIdOfScoreScreen = getBeatmapObject[0].beatmap_id;
            const userBestObject = await kirCore.osu.raw('/get_user_best', { u: isLinked[0].osu_id, m: 0, type: 'id', limit: 100 });

            let possibleUserBestObject = {};

            for (let i = 0; i < userBestObject.length; i++) {
                if (parseInt(userBestObject[i].beatmap_id) === parseInt(beatmapIdOfScoreScreen)) {
                    possibleUserBestObject = userBestObject[i];
                    break;
                }
            }

            if (!possibleUserBestObject.pp) {
                checking.edit({ embed: new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`This play unfortunately isn't in your top 100, hence I'm not able to fetch the info of it.`) 
                });
 
                return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'osu! OCR ERROR', `Play isn't  in top 100.`);
            }

            const fetchedBeatmap = await kirCore.osu.beatmaps.getByBeatmapId(beatmapIdOfScoreScreen);
            const diffIcon = KiramekiHelper.emojis.OSU.DIFFICULTIES[KiramekiHelper.getOsuDiffIconDesc(parseFloat(fetchedBeatmap[0].difficultyrating))];
            const userScoreResultsRank = KiramekiHelper.emojis.OSU.RANKS[possibleUserBestObject.rank];
            const mapModifiers = (KiramekiHelper.numberToMod(possibleUserBestObject.enabled_mods).length > 0) ? `+${KiramekiHelper.numberToMod(possibleUserBestObject.enabled_mods).join(',')}` : 'Nomod';
            const userResults = await kirCore.osu.user.get(linkageUsername, 0, undefined, 'string');
            const userCountry = KiramekiHelper.capitalize(countrynames.getName(userResults.country));
            const formattedCalcAcc = (((
                (parseInt(possibleUserBestObject.count300)  * 300) +
                (parseInt(possibleUserBestObject.count100)  * 100) +
                (parseInt(possibleUserBestObject.count50)   * 50)  +
                (parseInt(possibleUserBestObject.countmiss) * 0))  /
                ((
                    parseInt(possibleUserBestObject.count300) +
                    parseInt(possibleUserBestObject.count100) +
                    parseInt(possibleUserBestObject.count50)  +
                    parseInt(possibleUserBestObject.countmiss)
                ) * 300)) * 100).toFixed(2);

            
            checking.edit({ 
                embed: {
                    'title': `Score set in osu! **Standard** by **:flag_${userResults.country.toLowerCase()}: ${linkageUsername}**`,
                    'description': `[${playName}](https://osu.ppy.sh/b/${beatmapIdOfScoreScreen}&m=0)`,
                    'color': 0xF06DA8,
                    'timestamp': `${possibleUserBestObject.date.replace(' ', 'T')}.000Z`,
                    'thumbnail': {
                        'url': `https://b.ppy.sh/thumb/${getBeatmapObject[0].beatmapset_id}l.jpg?uts=${Math.floor(new Date() / 1000)}`
                    },
                    'fields': [
                        {
                            'name': 'Play Information',
                            'value': `${parseFloat(fetchedBeatmap[0].difficultyrating).toFixed(2)}${diffIcon}${userScoreResultsRank} **${formattedCalcAcc}%** ***${mapModifiers}*** *(Score: ${KiramekiHelper.numberWithCommas(parseInt(possibleUserBestObject.score))})*\n` +
                            `**Total Hits:** ` +
                            `${KiramekiHelper.emojis.OSU.HITS[300]} ${possibleUserBestObject.count300} ` +
                            `${KiramekiHelper.emojis.OSU.HITS[100]} ${possibleUserBestObject.count100} ` +
                            `${KiramekiHelper.emojis.OSU.HITS[50]} ${possibleUserBestObject.count50} ` +
                            `${KiramekiHelper.emojis.OSU.HITS.MISS} ${possibleUserBestObject.countmiss}`
                        },
                        {
                            'name': 'Beatmap Information',
                            'value': `Length: **${KiramekiHelper.secToMin(fetchedBeatmap[0].total_length)}**, AR: **${fetchedBeatmap[0].diff_approach}**, OD: **${fetchedBeatmap[0].diff_overall}**, CS: **${fetchedBeatmap[0].diff_size}**, BPM: **${fetchedBeatmap[0].bpm}**, HP: **${fetchedBeatmap[0].diff_drain}**`
                        },
                        {
                            'name': 'Performance',
                            'value': (possibleUserBestObject.pp == null) ? 'No PP from osu! API' : `**${parseFloat(possibleUserBestObject.pp).toFixed(2)}pp**`,
                            'inline': true
                        },
                        {
                            'name': 'Combo',
                            'value': `**${possibleUserBestObject.maxcombo}x** / *${fetchedBeatmap[0].max_combo}x*`,
                            'inline': true
                        }
                    ],
                    "footer": {
                        "icon_url": `https://a.ppy.sh/${isLinked[0].osu_id}?uts=${Math.floor(new Date() / 1000)}`,
                        "text": `${linkageUsername} #${userResults.pp_rank} Global, #${userResults.pp_country_rank} ${userCountry}`
                    }
                }
             });
            KiramekiHelper.updateOsuUser(kirCore.DB, userResults);
            KiramekiHelper.updateLastOsuRecentBMID(kirCore.DB, message.author.id, beatmapIdOfScoreScreen, message.channel.id);
        } catch (osuOCRError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'osu! OCR ERROR', `Analyzing a score screen failed because of: ${osuOCRError}`);
            console.log(osuOCRError);
        }
    }
}   

module.exports = new OsuScoreScreensOCR();