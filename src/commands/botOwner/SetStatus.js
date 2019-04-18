const KiramekiHelper = require('../../KiramekiHelper');

class SetStatus {
    constructor() {
        this.name = '';
        this.aliases = [''];
        this.permissions = [''];
        this.userPermissions = [''];
        this.category = KiramekiHelper.categories.OWNER;
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

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, '', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new SetStatus();