const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');

class WeebSlap {
    constructor() {
        this.name = 'slap';
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 5;
        this.help = {
            message: 'Slap someone you absolutely dislike ... full force.',
            usage: 'slap <target>',
            example: 'slap Flevor#0001',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        if (!target) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify a user you want to slap (ง •̀_•́)ง')
            );
        }

        const userToSlap = KiramekiHelper.getFirstMention(message) || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());

        // Check if either a user was mentioned or found by text based search
        if (!userToSlap) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I couldn\'t find the user you want to slap  (︶ω︶)')
            );
        }

        // Check if the author wants to selftag
        if (userToSlap.id === message.author.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t slap yourself, B..Baka!  (︶ω︶)')
            );
        }

        // Check if the target is Kirameki
        if (userToSlap.id === kirCore.user.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t slap me! (๑و•̀ω•́)و')
            );
        }

        // Disallow slapping the bot owner
        if (userToSlap.id === KiramekiConfig.botOwner) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Don\'t you dare try slapping my master! (๑و•̀ω•́)و')
            );
        }
        const randomImage = await KiramekiHelper.getRandomAnimeImage('slap');

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`**${message.author.username}** slaps **${userToSlap.mention}** vigorously (ง •̀_•́)ง`)
            .setImage(randomImage.url)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB SLAP', `${KiramekiHelper.userLogCompiler(message.author)} used the slap command.`);
    }
}

module.exports = new WeebSlap();