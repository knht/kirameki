const KiramekiHelper = require('../../KiramekiHelper');

class TranslateChart {
    constructor() {
        this.name = 'translatechart';
        this.aliases = ['trchart', 'trc'];
        this.category = KiramekiHelper.categories.TRANSLATIONS;
        this.help = {
            message: 'Get a country code chart for all languages supported by Kirameki.',
            usage: 'translatechart',
            example: 'translatechart',
            inline: true
        }
    }

    async execute(message, kirCore) {
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setDescription(`Click **[here](${KiramekiHelper.links.WEBSITE.TRANSLATIONS})** to show the country code chart!`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'TRANSLATE CHART', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new TranslateChart();