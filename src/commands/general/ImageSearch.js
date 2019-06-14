const KiramekiHelper = require('../../KiramekiHelper');

class ImageSearch {
    constructor() {
        this.name = 'images';
        this.aliases = ['image', 'img', 'imgs'];
        this.permissions = ['attachFiles'];
        this.subCommands = ['sfw', 'nsfw'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.nsfw = true;
        this.cooldown = 5;
        this.help = {
            message: 'Get a random image for your given search query.',
            usage: 'images <filter[sfw|nsfw]> <searchQuery>',
            example: ['images sfw Cute Panda', 'images nsfw *Dirty Stuff*'],
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, filter, searchQuery] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!filter || !searchQuery || !this.subCommands.includes(filter.toLowerCase())) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const isNsfw = (filter.toLowerCase() === 'nsfw') ? true : false;
        const images = await KiramekiHelper.scrapeBingImages(searchQuery, isNsfw);

        if (!images.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Couldn't find any images searching for **${searchQuery}**!`)
                .setDescription(
                    `There are a few possible reasons for this:\n\n` +
                    `• It maybe just doesn't exist.\n` + 
                    `• The search query is NSFW and not available through safe-search.\n` + 
                    `• You may have made a typo!`
                )
            );
        }

        const randomImage = KiramekiHelper.getRandomElementFromArray(images);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setImage(randomImage)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'IMAGES', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new ImageSearch();