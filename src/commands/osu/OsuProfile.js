const KiramekiHelper = require('../../KiramekiHelper');

class OsuProfile {
    constructor() {
        this.name = 'osu';
        this.aliases = ['osuprofile'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 5;
        this.help = {
            message: 'Get a full osu! profile information card together with the Top 3 scores of a player in a game mode specified! Providing an osu! username is optional if a linkage exists.',
            usage: 'osu <mode[std|mania|ctb|taiko]> [username]',
            example: ['osu std', 'osu std @Riya#0001', 'osu std Vaxei', 'osu mania Jakads'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, osuMode, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! PROFILE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuProfile();