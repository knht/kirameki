const KiramekiHelper = require('../../KiramekiHelper');

class InviteKirameki {
    constructor() {
        this.name = 'invite';
        this.category = KiramekiHelper.categories.GENERAL;
        this.owner = false;
        this.nsfw = false;
        this.cooldown = 3;
        this.help = {
            message: 'Get information about how to invite Kirameki to a server.',
            usage: 'invite',
            example: 'invite',
            inline: false
        }
    }

    async execute(message, kirCore) {
        message.channel.createMessage(KiramekiHelper.links.WEBSITE.INVITE);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'INVITE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new InviteKirameki();