const KiramekiHelper = require('../../KiramekiHelper');

class Coinflip {
    constructor() {
        this.category = KiramekiHelper.categories.GAMBLING;
        this.name = 'coinflip';
        this.aliases = ['cf'];
        this.help = {
            message: 'Flip a virtual coin with a graphical representation of the result.',
            usage: 'coinflip',
            example: 'coinflip',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const heads = Math.random() >= 0.5;

        if (heads) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("DEFAULT")
                .setTitle("You flipped **Heads!**")
                .setImage(KiramekiHelper.images.GAMBLING.COINFLIP.HEADS)
            );
        } else {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("DEFAULT")
                .setTitle("You flipped **Tails!**")
                .setImage(KiramekiHelper.images.GAMBLING.COINFLIP.TAILS)
            );
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'COINFLIP', `${KiramekiHelper.userLogCompiler(message.author)} flipped a coin!`);
    }
}

module.exports = new Coinflip();