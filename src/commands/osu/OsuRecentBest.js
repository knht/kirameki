const KiramekiHelper = require('../../KiramekiHelper');

class OsuRecentBest {
    constructor() {
        this.name = 'recentbest';
        this.aliases = ['osurb', 'rb'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Retrieve the ***best*** **most recent** play in osu! Standard including map completion and PP calculations! Providing an osu! username is optional if a linkage exists.',
            usage: 'recentbest [username]',
            example: ['recentbest', 'recentbest FlyingTuna', 'recentbest @Riya#0001'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        /**
         * @todo Finish command
         */

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! RECENT BEST', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuRecentBest();