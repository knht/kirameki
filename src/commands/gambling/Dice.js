const KiramekiHelper = require('../../KiramekiHelper');

class CommandClassName {
    constructor() {
        this.name = 'dice';
        this.aliases = ['rolldice'];
        this.category = KiramekiHelper.categories.GAMBLING;
        this.owner = false;
        this.nsfw = false;
        this.help = {
            message: 'Roll the dice and receive the outcome graphically.',
            usage: 'dice',
            example: 'dice',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const rolledFace = KiramekiHelper.randomIntFromInterval(1, 6);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setTitle("🎲 Roll the Dice")
            .setDescription(`You rolled a **${rolledFace}**!`)
            .setImage(KiramekiHelper.images.GAMBLING.DICE.getFace(rolledFace))
            .setFooter(`Rolled by: ${message.author.username}`, message.author.avatarURL)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'DICE', `${KiramekiHelper.userLogCompiler(message.author)} rolled the dice and threw a ${rolledFace}!`)
    }
}

module.exports = new CommandClassName();