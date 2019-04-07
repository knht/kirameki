const KiramekiHelper = require('../../KiramekiHelper');

class Psikwow {
    constructor() {
        this.name = 'p5ikwow';
        this.category = KiramekiHelper.categories.MEMES;
        this.help = {
            message: 'No explanation needed, try for yourself.',
            usage: 'P5ikWow',
            example: 'P5ikWow',
            inline: true
        }
    }

    async execute(message, kirCore) {
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setTitle('P5ikWow')
            .setImage(KiramekiHelper.images.PSIKWOW)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'P5IKWOW', `${KiramekiHelper.userLogCompiler(message.author)} used the P5ikWow command.`);
    }
}

module.exports = new Psikwow();