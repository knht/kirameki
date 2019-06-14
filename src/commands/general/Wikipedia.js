const KiramekiHelper = require('../../KiramekiHelper');
const axios = require('axios');
const isoConv = require('iso-language-converter');

class Wikipedia {
    constructor() {
        this.name = 'wikipedia';
        this.aliases = ['wiki'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 3;
        this.help = {
            message: 'Search up a definition on Wikipedia.',
            usage: 'wikipedia <language> <searchText>',
            example: ['wikipedia en Water', 'wikipedia jp 水'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, language, searchText] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!language || !searchText) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const fromConverted = isoConv(language);
        const wikipediaResult = await axios.get(`https://${language}.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&redirects=1&titles=${encodeURI(searchText.replace(/ /g, '%20'))}`);
        const wikipediaResultKey = Object.keys(wikipediaResult.data.query.pages)[0];
        const wikipediaResultFinal = {
            name: `[${wikipediaResult.data.query.pages[wikipediaResultKey].title}](https://${language}.wikipedia.org/wiki/${searchText.replace(/ /g, '_')})`,
            id: wikipediaResult.data.query.pages[wikipediaResultKey].pageid,
            description: wikipediaResult.data.query.pages[wikipediaResultKey].extract
        };

        if (!wikipediaResult.data.query.pages[wikipediaResultKey].extract) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Couldn't find any results for **${searchText}**!`)
            );
        }

        const trimmedWikipediaDescription = KiramekiHelper.trimWikipediaDescription(wikipediaResultFinal.description, wikipediaResult.data.query.pages[wikipediaResultKey].title, language);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(0xFFFFFF)
            .setTitle('Wikipedia')
            .setThumbnail(KiramekiHelper.images.WIKIPEDIA_LOGO)
            .setDescription(`Here is what I found for your search term **${searchText}**:`)
            .addBlankField(false)
            .addField('Article Name', wikipediaResultFinal.name, true)
            .addField('Language', fromConverted || language, true)
            .addBlankField(false)
            .addField('Description', trimmedWikipediaDescription, false)
            .setFooter(`Wikipedia article requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WIKIPEDIA', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Wikipedia();