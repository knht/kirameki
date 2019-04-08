const KiramekiHelper = require('../../KiramekiHelper');

class Dankify {
    constructor() {
        this.name = 'dankify';
        this.category = KiramekiHelper.categories.MEMES;
        this.help = {
            message: 'Generate a dankified text using regional indicators.',
            usage: 'dankify',
            example: 'dankify I be flossin',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, text] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!text) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        // Check if the provided text is longer than 90 characters to not exceed the 2000 char limit of Discord when converting to regional indicators
        if (text.length > 90) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Text must be shorter than 90 letters!')
            );
        }

        let dankifiedText = [];

        for (let i = 0; i < text.length; i++) {
            dankifiedText.push((text.charAt(i) === ' ')
                ? ':black_large_square: '
                : (KiramekiHelper.emojis.REGIONAL_INDICATORS[text.charAt(i).toUpperCase()])
                ? `${KiramekiHelper.emojis.REGIONAL_INDICATORS[text.charAt(i).toUpperCase()]} `
                : '');
        }

        message.channel.createMessage(dankifiedText.join(''));
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'DANKIFY', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Dankify();