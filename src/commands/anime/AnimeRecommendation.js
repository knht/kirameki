const KiramekiHelper = require('../../KiramekiHelper');
const kitsu = require('node-kitsu');

class AnimeRecommendation {
    constructor() {
        this.name = 'animerec';
        this.aliases = ['animerecommend', 'animerecommendation', 'anirec'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 3;
        this.help = {
            message: 'Get a random anime recommendation including detailed information about it.',
            usage: 'animerec',
            example: 'animerec',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const animeToSearchFor = await KiramekiHelper.query(kirCore.DB, 'SELECT * FROM animes WHERE language = \'en\' ORDER BY RAND() LIMIT 1;');
        const searchingMessage = await message.channel.createEmbed(new KiramekiHelper.Embed().setColor('GREEN').setTitle('Looking for anime to recommend ..'));
        const animeSearchResponse = await kitsu.searchAnime(animeToSearchFor[0].title, 0);

        try {
            const responseEmbed = new KiramekiHelper.Embed()
                .setColor(KiramekiHelper.getRandomColor())
                .setAuthor('Anime Recommendations', KiramekiHelper.images.KIRAMEKI_MASCOT)
                .setThumbnail(animeSearchResponse[0].attributes.posterImage.original)
                .setDescription(`[${animeSearchResponse[0].attributes.canonicalTitle}](https://kitsu.io/anime/${animeSearchResponse[0].attributes.slug}) *(Type: ${animeSearchResponse[0].attributes.subtype.charAt(0).toUpperCase() + animeSearchResponse[0].attributes.subtype.slice(1)})*`)
                .addField('Available Episodes', animeSearchResponse[0].attributes.episodeCount, true)
                .addField("Episode Length", animeSearchResponse[0].attributes.episodeLength + " minutes", true)
                .addField("Age Rating", animeSearchResponse[0].attributes.ageRatingGuide, true)
                .addField("Status", animeSearchResponse[0].attributes.status.charAt(0).toUpperCase() + animeSearchResponse[0].attributes.status.slice(1), true)
                .addBlankField(false)
                .addField("Description", (animeSearchResponse[0].attributes.synopsis.length > 550) ? `${animeSearchResponse[0].attributes.synopsis.substring(0, 550)}...` : animeSearchResponse[0].attributes.synopsis , false);
            
            searchingMessage.edit({
                embed: responseEmbed
            });
        } catch (error) {
            searchingMessage.edit({
                embed: new KiramekiHelper.Embed().setColor('RED').setTitle('Couldn\'t grab anime metadata. Please try again.')
            });
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ANIME RECOMMENDATION', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new AnimeRecommendation();