const KiramekiHelper = require('../../KiramekiHelper');

class Roll {
    constructor() {
        this.category = KiramekiHelper.categories.GAMBLING;
        this.name = 'roll';
        this.help = {
            message: 'Roll a random number between **1** and **100** to settle disputes once and for all!\nInspired by the `!roll` command found on osu!\'s BanchoBot.',
            usage: 'roll',
            example: 'roll',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const rolledNumber  = KiramekiHelper.randomIntFromInterval(1, 100);
        const pointPlural   = (rolledNumber === 1) ? 'point' : 'points';

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setAuthor(`${message.author.username} rolled ${rolledNumber} ${pointPlural}!`, message.author.dynamicAvatarURL('jpg', 128))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ROLL', `${KiramekiHelper.userLogCompiler(message.author)} used the roll command!`);
    }
}

module.exports = new Roll();