const KiramekiHelper = require('../../KiramekiHelper');

class LetMeGoogleThatForYou {
    constructor() {
        this.name = 'lmgtfy';
        this.category = KiramekiHelper.categories.GENERAL;
        this.help = {
            message: 'Generate a Let Me Google That For You link supporting both web and image searches, defaulting to web search.',
            usage: 'lmgtfy <type> <searchQuery>',
            example: ['lmgtfy web Why is the sun yellow', 'lmgtfy images How do you multiply'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, type, searchQuery] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!type || !searchQuery) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));

        const link = (type.toLowerCase() === 'images' || type.toLowerCase() === 'image') 
            ? `http://lmgtfy.com/?t=i&q=${searchQuery.replace(/ /g, '%20')}`
            : `http://lmgtfy.com/?q=${searchQuery.replace(/ /g, '%20')}`;
        
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`[Let me Google that for you!](${link})`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'LMGTFY', `${KiramekiHelper.userLogCompiler(message.author)} just generated an LMGTFY link!`);
    }
}

module.exports = new LetMeGoogleThatForYou();