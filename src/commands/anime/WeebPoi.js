const KiramekiHelper = require('../../KiramekiHelper');

class CommandClassName {
    constructor() {
        this.name = 'poi';
        this.aliases = [''];
        this.permissions = [''];
        this.userPermissions = [''];
        this.category = KiramekiHelper.categories.ANIME;
        this.owner = false;
        this.nsfw = false;
        this.cooldown = 2;
        this.help = {
            message: '',
            usage: '',
            example: '',
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

    }
}

module.exports = new CommandClassName();