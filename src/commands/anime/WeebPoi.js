const KiramekiHelper = require('../../KiramekiHelper');

class WeebPoi {
    constructor() {
        this.name = 'poi';
        this.aliases = ['yuudachi'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 5;
        this.help = {
            message: 'Get a random image of Yuudachi from Kancolle.',
            usage: 'poi',
            example: 'poi',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const result = await KiramekiHelper.getRandomAnimeImage('poi');

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setImage(result.url)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB POI', `${KiramekiHelper.userLogCompiler(message.author)} used the poi command.`);
    }
}

module.exports = new WeebPoi();