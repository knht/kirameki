const KiramekiHelper = require('../../KiramekiHelper');
const pokemon = require('pokemon');
const pokemonGif = require('pokemon-gif');
const isoConv = require('iso-language-converter');

class PokemonTranslate {
    constructor() {
        this.name = 'pokemontranslate';
        this.aliases = ['ptr', 'poketranslate'];
        this.subCommands = ['de', 'en', 'fr', 'ja', 'ko', 'ru', 'zh-hans', 'zh-hant']
        this.category = KiramekiHelper.categories.TRANSLATIONS;
        this.cooldown = 3;
        this.help = {
            message: `Translate a Pokémon name from any supported language to any supported language. You can see a list of all supported languages by [clicking here.](${KiramekiHelper.links.WEBSITE.TRANSLATIONS})`,
            usage: 'pokemontranslate <fromLanguage> <toLanguage> <pokémonName>',
            example: ['pokemontranslate en ja Magikarp', 'ptr de fr Karpador'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, fromLanguage, toLanguage, pokemonName] = KiramekiHelper.tailedArgs(message.content, ' ', 3);

        if (
               !fromLanguage 
            || !toLanguage 
            || !pokemonName 
            || !this.subCommands.includes(fromLanguage.toLowerCase())
            || !this.subCommands.includes(toLanguage.toLowerCase())
        ) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const fromLanguageSanitized = (fromLanguage.toLowerCase().startsWith('zh-')) 
            ? `${fromLanguage.split('-')[0].toLowerCase()}-${KiramekiHelper.capitalize(fromLanguage.split('-')[1])}`
            : fromLanguage.toLowerCase();
        
        const toLanguageSanitized = (toLanguage.toLowerCase().startsWith('zh-')) 
            ? `${toLanguage.split('-')[0].toLowerCase()}-${KiramekiHelper.capitalize(toLanguage.split('-')[1])}`
            : toLanguage.toLowerCase();

        const fromLanguageConverted = isoConv(fromLanguageSanitized.split('-')[0]);
        const toLanguageConverted = isoConv(toLanguageSanitized.split('-')[0]);

        try {
            const pokemonNameSanitized = KiramekiHelper.capitalize(pokemonName.toLowerCase());
            const pokemonID = pokemon.getId(pokemonNameSanitized, fromLanguageSanitized);
            const pokemonNameTranslated = pokemon.getName(pokemonID, toLanguageSanitized);
            const pokemonIconURL = pokemonGif(pokemonID);

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setAuthor('Pokémon Translate', KiramekiHelper.images.POKEBALL_LOGO)
                .setThumbnail(pokemonIconURL)
                .setDescription(`Details for **${pokemonNameTranslated}**:`)
                .addField(`${fromLanguageConverted} Name`, pokemonNameSanitized, true)
                .addField(`${toLanguageConverted} Name`, pokemonNameTranslated, true)
                .setFooter(`Translation was requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
            );
        } catch (pokemonTranslationError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Unable to translate Pokémon **${pokemonName}** from **${fromLanguageConverted}** to **${toLanguageConverted}**!`)
                .setDescription(
                    `This may be due to various reasons. The most common ones being that a language code was specified that isn't supported or the Pokémon doesn't exist!\n\n` + 
                    `You can [click here](${KiramekiHelper.links.WEBSITE.TRANSLATIONS}) to show all languages supported by Pokémon Translate.`
                )
            );

            return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'POKÉMON TRANSLATE ERROR', `Translations failed because of: ${pokemonTranslationError}`);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'POKÉMON TRANSLATE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new PokemonTranslate();