const KiramekiHelper = require('../../KiramekiHelper');
const ChartjsNode = require('chartjs-node');
const uniqid = require('uniqid');
const Canvas = require('canvas');

class OsuStrain {
    constructor() {
        this.name = 'strain';
        this.owner = true;
        this.cooldown = 15;
        this.permissions = ['attachFiles'];
        this.aliases = ['osustrain'];
    }

    async execute(message, kirCore) {
        const [command, args]   = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const loadingMessage    = await message.channel.createEmbed(new KiramekiHelper.Embed().setColor("GREEN").setTitle("Calculating ..."));
        const strainMods        = (args) ? KiramekiHelper.modToNumbers(args) : 0;
        const beatmapID         = await KiramekiHelper.getLatestBMID(kirCore.DB, message.channel.id);

        if (beatmapID === -1) {
            return message.channel.createEmbed(new KiramekiHelper.RichEmbed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Strain Graph", KiramekiHelper.images.OSU_LOGO)
                .setDescription("It appears there hasn't been any recent beatmap interaction in this particular channel before! To use this command a recent score or beatmap link must have been published at least once in this channel!")
            );
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
        const bgImage       = await Canvas.loadImage('https://img.kirameki.one/IizpW6sj.jpg');
        const graphImage    = await Canvas.loadImage(graphBuffer);

        // Draw background image
        ctx.drawImage(bgImage, 0, 0, 800, 450);

        // Draw graph
        ctx.drawImage(graphImage, 0, 0, 800, 450);

        await message.channel.createMessage(undefined, { file: modCanvas.toBuffer(), name: `${uniqid()}.png` });
        loadingMessage.edit({ embed: new KiramekiHelper.Embed().setColor("GREEN").setTitle(`Finished processing **${beatmapStrainObject.map.title}**`) });
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! STRAIN', `${KiramekiHelper.userLogCompiler(message.author)} used the osu! Strain command!`);
    }
}

module.exports = new OsuStrain();