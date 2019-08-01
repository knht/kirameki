const KiramekiHelper = require('../../KiramekiHelper');
const kitsu = require('node-kitsu');

class AnimeSearch {
    constructor() {
        this.name = 'anime';
        this.aliases = ['animesearch', 'anisearch'];
        this.permissions = ['manageMessages'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 3;
        this.help = {
            message: 'Search for an anime title and get detailed information about it including a description and episode guide.',
            usage: 'anime <name>',
            example: 'anime konosuba',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, animeName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!animeName) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));

        const searchingMessage = await message.channel.createEmbed(new KiramekiHelper.Embed().setColor('GREEN').setTitle('Looking for anime ...'));
        const animeSearchResponse = await kitsu.searchAnime(animeName, 0);
        const picks = [];

        try {
            for (let i = 0; i < animeSearchResponse.length; i++) {
                picks.push(`${i + 1}. **${animeSearchResponse[i].attributes.canonicalTitle}**`)
            }

            const animeChoice = await searchingMessage.edit({
                embed: new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('Anime Search')
                .setThumbnail(KiramekiHelper.images.KIRAMEKI_MASCOT)
                .setDescription(`Please pick an anime. You can pick an anime by writing the corresponding number into the Discord chat.\n\n${picks.join('\n')}`)
                .setFooter('You have 1 minute to pick an anime')
            });

            const filter = (m) => message.author.id === m.author.id;
            const awaitedMessage = await message.channel.awaitMessages(filter, { time: 60000, maxMatches: 1 });
            const choice = parseInt(awaitedMessage[0].content.replace(/[^0-9\.]+/g, ''));

            if (choice > picks.length || choice < 1 || !choice) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`Invalid numerical choice. Aborting ...`)
                );
            }

            awaitedMessage[0].delete();
            searchingMessage.edit({
                embed: new KiramekiHelper.Embed()
                .setColor(KiramekiHelper.getRandomColor())
                .setAuthor('Anime Information', KiramekiHelper.images.KIRAMEKI_MASCOT)
                .setThumbnail(animeSearchResponse[choice - 1].attributes.posterImage.original)
                .setDescription(`[${animeSearchResponse[choice - 1].attributes.canonicalTitle}](https://kitsu.io/anime/${animeSearchResponse[choice - 1].attributes.slug}) *(Type: ${animeSearchResponse[choice - 1].attributes.subtype.charAt(0).toUpperCase() + animeSearchResponse[choice - 1].attributes.subtype.slice(1)})*`)
                .addField('Available Episodes', (animeSearchResponse[choice - 1].attributes.episodeCount) ? animeSearchResponse[choice - 1].attributes.episodeCount : 'N/A', true)
                .addField('Episode Length', (animeSearchResponse[choice - 1].attributes.episodeLength) ? `${animeSearchResponse[choice - 1].attributes.episodeLength} minutes` : 'N/A', true)
                .addField('Age Rating', (animeSearchResponse[choice - 1].attributes.ageRatingGuide) ? animeSearchResponse[choice - 1].attributes.ageRatingGuide : 'N/A', true)
                .addField('Status', (animeSearchResponse[choice - 1].attributes.status.charAt(0).toUpperCase() + animeSearchResponse[choice - 1].attributes.status.slice(1)) ? animeSearchResponse[choice - 1].attributes.status.charAt(0).toUpperCase() + animeSearchResponse[choice - 1].attributes.status.slice(1) : 'N/A', true)
                .addBlankField(false)
                .addField("Description",((animeSearchResponse[choice - 1].attributes.synopsis.length > 850) ? `${animeSearchResponse[choice - 1].attributes.synopsis.substring(0, 850)}...` : animeSearchResponse[choice - 1].attributes.synopsis) ? (animeSearchResponse[choice - 1].attributes.synopsis.length > 850) ? `${animeSearchResponse[choice - 1].attributes.synopsis.substring(0, 850)}...` : animeSearchResponse[choice - 1].attributes.synopsis : 'N/A' , false)
            });
        } catch (error) {
            searchingMessage.edit({
                embed: new KiramekiHelper.Embed().setColor('RED').setTitle('You haven\'t specified an anime.')
            });
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ANIME SEARCH', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new AnimeSearch();