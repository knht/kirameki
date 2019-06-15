const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const translate = require('translate');
const isoConv = require('iso-language-converter');

class Translate {
    constructor() {
        this.name = 'translate';
        this.aliases = ['tr'];
        this.category = KiramekiHelper.categories.TRANSLATIONS;
        this.cooldown = 5;
        this.help = {
            message: `Translate any message from any supported language to any supported language. [Click here](${KiramekiHelper.links.WEBSITE.TRANSLATIONS}) to see all supported languages and their corresponding country codes.`,
            usage: 'translate <fromLanguage> <toLanguage> <text>',
            example: ['translate en ja I like pandas', 'translate cn de 雪花'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, fromLanguage, toLanguage, text] = KiramekiHelper.tailedArgs(message.content, ' ', 3);

        if (!fromLanguage || !toLanguage || !text) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        try {
            translate.engine = 'yandex';
            translate.key = KiramekiConfig.yandexApiKey;

            const translatedText = await translate(text, { from: fromLanguage, to: toLanguage });
            const fromConverted = isoConv(fromLanguage);
            const toConverted = isoConv(toLanguage);

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0x4f8bf5)
                .setThumbnail(KiramekiHelper.images.TRANSLATE_LOGO)
                .setTitle('Kirameki Translate')
                .setDescription(`Translating from **${fromConverted}** to **${toConverted}**`)
                .addField('Translation', translatedText, false)
                .setFooter(`Translation requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
            );
        } catch (translationError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Unable to translate text from **${fromLanguage}** to **${toLanguage}**!`)
                .setDescription(
                    `This may be due to various reasons. The most common one being that a language code was specified that isn't supported by Kirameki or is invalid.\n\n` + 
                    `You can [click here](${KiramekiHelper.links.WEBSITE.TRANSLATIONS}) to show all languages and their codes supported by Kirameki.`
                )
            );

            return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'TRANSLATE ERROR', `Translations failed because of: ${translationError}`);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'TRANSLATE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Translate();