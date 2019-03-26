const KiramekiHelper = require('../../KiramekiHelper');

class Coinflip {
    constructor() {
        this.name = 'coinflip';
        this.aliases = ['cf'];
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