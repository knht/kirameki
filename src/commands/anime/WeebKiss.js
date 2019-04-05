const KiramekiHelper = require('../../KiramekiHelper');

class WeebKiss {
    constructor() {
        this.name = 'kiss';
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 7.5;
        this.help = {
            message: 'Kiss someone very dear to you passionately.',
            usage: 'kiss <target>',
            example: 'kiss @Soleriel#5984',
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
                .setTitle('Please specify a user you want to kiss (ɔˆ ³(ˆ⌣ˆc)')
            );
        }

        const userToKiss = KiramekiHelper.getFirstMention(message) || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());

        // Check if either a user was mentioned or found by text based search
        if (!userToKiss) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I couldn\'t find the user you want to kiss  (︶ω︶)')
            );
        }

        // Check if the author wants to selftag
        if (userToKiss.id === message.author.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t kiss yourself, B..Baka!  (︶ω︶)')
            );
        }

        // Check if the target is Kirameki
        if (userToKiss.id === kirCore.user.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I..I don\'t want to kiss with humans! Thanks ( •⌄• ू )✧')
            );
        }

        const randomImage = await KiramekiHelper.getRandomAnimeImage('kiss');

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`**${message.author.username}** kisses **${userToKiss.mention}** ${adverb} (ɔˆ ³(ˆ⌣ˆc)`)
            .setImage(randomImage.url)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB KISS', `${KiramekiHelper.userLogCompiler(message.author)} used the kiss command.`);
    }
}

module.exports = new WeebKiss();