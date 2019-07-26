const KiramekiHelper = require('../../KiramekiHelper');

class Owoify {
    constructor() {
        this.name = 'owoify';
        this.category = KiramekiHelper.categories.ANIME;
        this.help = {
            message: 'OwOify any text you provide for all your OwO and UwU needs.',
            usage: 'owoify <text>',
            example: 'owoify Hello There!',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, text] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!text) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        message.channel.createMessage(KiramekiHelper.owoify(text));

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'OWOIFY', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Owoify();