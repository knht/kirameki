const KiramekiHelper = require('../../KiramekiHelper');
const ChartjsNode = require('chartjs-node');
const uniqid = require('uniqid');
const Canvas = require('canvas');

class OsuStrain {
    constructor() {
        this.category = KiramekiHelper.categories.OSU;
        this.name = 'strain';
        this.owner = false;
        this.cooldown = 15;
        this.permissions = ['attachFiles'];
        this.aliases = ['osustrain'];
        this.help = {
		    message: 'Calculate the aim, speed and total strain of a previously posted osu! beatmap. Providing mods is optional defaulting to no mods.',
		    usage: 'strain [mods]',
		    example: ['strain', 'strain +HD,HR', 'strain +HD,HR,DT,FL']
		}
    }

    async execute(message, kirCore) {
        const [command, args]   = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const strainMods        = (args) ? KiramekiHelper.modToNumbers(args) : 0;
        const beatmapID         = await KiramekiHelper.getLatestBMID(kirCore.DB, message.channel.id);

        if (beatmapID === -1) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Strain Graph", KiramekiHelper.images.OSU_LOGO)
                .setDescription("It appears there hasn't been any recent beatmap interaction in this particular channel before! To use this command a recent score or beatmap link must have been published at least once in this channel!")
            );
        }

        const loadingMessage        = await message.channel.createEmbed(new KiramekiHelper.Embed().setColor("GREEN").setTitle("Calculating ..."));
        const doesChartAlreadyExist = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT beatmap_title, graph FROM osu_strain_graphs WHERE beatmap_id = ? AND mods = ? LIMIT 1;', [beatmapID, strainMods]);

        if (doesChartAlreadyExist.length > 0) {
            const databaseGraph = Buffer.from(doesChartAlreadyExist[0].graph, 'base64');

            await message.channel.createMessage(undefined, { file: databaseGraph, name: `${uniqid()}.png` });
            loadingMessage.edit({ embed: new KiramekiHelper.Embed().setColor("GREEN").setTitle(`Finished processing **${doesChartAlreadyExist[0].beatmap_title}**`) });

            return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! STRAIN CACHED', `${KiramekiHelper.userLogCompiler(message.author)} used the osu! Strain command on a cached map!`);
        }

        const chartNode             = new ChartjsNode(800, 450);
        const beatmapOsuFile        = await KiramekiHelper.obtainAndCacheOsuFile(beatmapID);
        const beatmapStrainObject   = KiramekiHelper.getBeatmapStrain(beatmapOsuFile, strainMods);
        const modStringParsed       = (KiramekiHelper.numberToMod(strainMods).length) ? `+${KiramekiHelper.numberToMod(strainMods).join(',')}` : '';
        const graphingOptions       = {
            type: 'line',
            data: {
                labels: beatmapStrainObject.timing,
                datasets: [
                    {
                        data: beatmapStrainObject.total,
                        label: "Total Strain",
                        borderColor: "#FF9185",
                        fill: true,
                        pointRadius: 0,
                        tension: 0
                    },
                    {
                        data: beatmapStrainObject.speed,
                        label: "Speed Strain",
                        borderColor: "#2ECC71",
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        data: beatmapStrainObject.aim,
                        label: "Aim Strain",
                        borderColor: "#3498DB",
                        fill: true,
                        pointRadius: 0
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    fontColor: '#d2d9dc',
                    fontSize: 18,
                    padding: 20,
                    text: `${beatmapStrainObject.map.artist} - ${beatmapStrainObject.map.title} [${beatmapStrainObject.map.version}] ${modStringParsed}`
                },
                legend: {
                    labels: {
                        fontColor: '#d2d9dc',
                        fontSize: 16
                    }
                }
            }
        }

        const graphInstance = await chartNode.drawChart(graphingOptions);
        const graphBuffer   = await chartNode.getImageBuffer('image/png');

        chartNode.destroy();

        const modCanvas     = Canvas.createCanvas(800, 450);
        const ctx           = modCanvas.getContext('2d');
        const graphImage    = await Canvas.loadImage(graphBuffer);

        let bgImage;

        try {
            bgImage = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmapStrainObject.map.beatmap_set_id}/covers/cover.jpg`); 
        } catch (e) {
            bgImage = await Canvas.loadImage(KiramekiHelper.images.OSU_STRAIN_GRAPH_BACKGROUND);
        }

        // Draw background image
        ctx.drawImage(bgImage, modCanvas.width / 2 - (450 * bgImage.width / bgImage.height) / 2, 0, 450 * bgImage.width / bgImage.height, 450);

        // Draw background alpha
        ctx.fillStyle = 'rgba(9, 9, 9, .85)';
        ctx.fillRect(0, 0, 800, 450);

        // Draw graph
        ctx.drawImage(graphImage, 0, 0, 800, 450);

        const graphResult = modCanvas.toBuffer();

        await message.channel.createMessage(undefined, { file: graphResult, name: `${uniqid()}.png` });
        loadingMessage.edit({ embed: new KiramekiHelper.Embed().setColor("GREEN").setTitle(`Finished processing **${beatmapStrainObject.map.title}**`) });
        KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO osu_strain_graphs (id, beatmap_id, beatmap_title, mods, graph) VALUES (NULL, ?, ?, ?, ?);', [beatmapID, beatmapStrainObject.map.title, strainMods, graphResult.toString('base64')]);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! STRAIN UNCACHED', `${KiramekiHelper.userLogCompiler(message.author)} used the osu! Strain command on an uncached map!`);
    }
}

module.exports = new OsuStrain();