const KiramekiHelper = require('../../KiramekiHelper');
const ChartjsNode = require('chartjs-node');
const uniqid = require('uniqid');

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
        const loadingMessage    = message.channel.sendTyping();
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
                plugins: {
                    beforeDraw: async (chartInstance) => {
                        var ctx = chartInstance.chart.ctx;
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
                    }
                },
                title: {
                    display: true,
                    fontSize: 16,
                    padding: 20,
                    text: `${beatmapStrainObject.map.artist} - ${beatmapStrainObject.map.title} [${beatmapStrainObject.map.version}] ${modStringParsed}`
                }
            }
        }

        const graphInstance = await chartNode.drawChart(graphingOptions);
        const graphBuffer   = await chartNode.getImageBuffer('image/png');

        message.channel.createMessage(undefined, { file: graphBuffer, name: `${uniqid()}.png` });
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! STRAIN', `${KiramekiHelper.userLogCompiler(message.author)} used the osu! Strain command!`);
        chartNode.destroy();
    }
}

module.exports = new OsuStrain();