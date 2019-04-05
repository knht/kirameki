const KiramekiHelper = require('../../KiramekiHelper');

class WeebCuddle {
    constructor() {
        this.name = 'cuddle';
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 5;
        this.help = {
            message: 'Cuddle with someone very dear to you lovely.',
            usage: 'cuddle <target>',
            example: 'cuddle @Dory#0001',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const options = ['thoroughly', 'lovely', 'delicately', 'delightfully', 'gracefully', 'pleasingly', 'passionately'];
        const adverb = options[Math.floor(Math.random() * options.length)];
        
        if (!target) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify a user you want to cuddle with (✿˶◕‿◕˶人◕ᴗ◕✿)')
            );
        }

        const userToCuddle = KiramekiHelper.getFirstMention(message) || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());

        // Check if either a user was mentioned or found by text based search
        if (!userToCuddle) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I couldn\'t find the user you want to cuddle with  (︶ω︶)')
            );
        }

        // Check if the author wants to selftag
        if (userToCuddle.id === message.author.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t cuddle with yourself, B..Baka!  (︶ω︶)')
            );
        }

        // Check if the target is Kirameki
        if (userToCuddle.id === kirCore.user.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I..I don\'t want to cuddle with humans! Thanks ( •⌄• ू )✧')
            );
        }

        const randomImage = await KiramekiHelper.getRandomAnimeImage('cuddle');

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`**${message.author.username}** cuddles with **${userToCuddle.mention}** ${adverb} (✿˶◕‿◕˶人◕ᴗ◕✿)`)
            .setImage(randomImage.url)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB CUDDLE', `${KiramekiHelper.userLogCompiler(message.author)} used the cuddle command.`);
    }
}

module.exports = new WeebCuddle();