const KiramekiHelper = require('../../KiramekiHelper');

class Roll {
    constructor() {
        this.name = 'roll';
    }

    async execute(message, kirCore) {
        const rolledNumber  = KiramekiHelper.randomIntFromInterval(1, 100);
        const pointPlural   = (rolledNumber === 1) ? 'poin' : 'points';

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setAuthor(`${message.author.username} rolled ${rolledNumber} ${pointPlural}!`, message.author.dynamicAvatarURL('jpg', 128))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ROLL', `${KiramekiHelper.userLogCompiler(message.author)} used the roll command!`);
    }
}

module.exports = new Roll();