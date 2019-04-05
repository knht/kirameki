const KiramekiHelper = require('../../KiramekiHelper');

class WeebHug {
    constructor() {
        this.name = 'hug';
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 7.5;
        this.help = {
            message: 'Hug someone very dear to you gracefully',
            usage: 'hug <target>',
            example: ['hug Kukai', 'hug @Riya#0001'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const options = ['thoroughly', 'lovely', 'delicately', 'delightfully', 'gracefully', 'pleasingly', 'passionately'];
        const adverb = options[Math.floor(Math.random() * options.length)];
        
        if (!target) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify a user you want to hug (づ｡◕‿‿◕｡)づ')
            );
        }

        const userToHug = KiramekiHelper.getFirstMention(message) || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());

        // Check if either a user was mentioned or found by text based search
        if (!userToHug) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I couldn\'t find the user you want to hug  (︶ω︶)')
            );
        }

        // Check if the author wants to selftag
        if (userToHug.id === message.author.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t hug yourself, B..Baka!  (︶ω︶)')
            );
        }

        // Check if the target is Kirameki
        if (userToHug.id === kirCore.user.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I..I don\'t want to get hugged! Thanks ( •⌄• ू )✧')
            );
        }

        const randomImage = await KiramekiHelper.getRandomAnimeImage('hug');

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`**${message.author.username}** hugs **${userToHug.mention}** ${adverb} (づ｡◕‿‿◕｡)づ`)
            .setImage(randomImage.url)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB HUG', `${KiramekiHelper.userLogCompiler(message.author)} used the hug command.`);
    }
}

module.exports = new WeebHug();