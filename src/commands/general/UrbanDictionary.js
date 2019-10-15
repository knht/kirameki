const KiramekiHelper = require('../../KiramekiHelper');

class UrbanDictionary {
    constructor() {
        this.name = 'urban';
        this.aliases = ['urbandictionary', 'ud'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.nsfw = true;
        this.cooldown = 3;
        this.help = {
            message: 'Look up a definition on Urban Dictionary',
            usage: 'urban <query>',
            example: 'urban JFC',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, query] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!query) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const udResult = await KiramekiHelper.getUrbanDefinition(query);

        if (!udResult) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`We couldn't find a definition for query **${query}**!`)
            );
        }

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setAuthor('Urban Dictionary', KiramekiHelper.images.URBAN_DICTIONARY_LOGO)
            .addField('Word', KiramekiHelper.sanitizeUrbanDefinition(udResult.word), false)
            .addField('Definition', KiramekiHelper.sanitizeUrbanDefinition(udResult.definition), false)
            .addField('Example', KiramekiHelper.sanitizeUrbanDefinition(udResult.example), false)
            .addField('Thumbs Up', udResult.thumbs_up || '0', true)
            .addField('Thumbs Down', udResult.thumbs_down || '0', true)
            .setThumbnail(KiramekiHelper.images.URBAN_DICTIONARY_LOGO)
            .setFooter(`Submitted by: ${KiramekiHelper.sanitizeUrbanDefinition(udResult.author)}`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'URBAN DICTIONARY', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new UrbanDictionary();