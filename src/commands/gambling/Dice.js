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
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        // TODO: implement feature
    }
}

module.exports = new CommandClassName();