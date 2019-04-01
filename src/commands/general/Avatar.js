const KiramekiHelper = require('../../KiramekiHelper');

class Avatar {
    constructor() {
        this.name = 'avatar';
        this.category = KiramekiHelper.categories.GENERAL;
        this.owner = false;
        this.aliases = ['guildicon', 'useravatar', 'userimage'];
        this.help = {
            message: 'Request the high resolution avatar of a specified user, yourself, or the guild by specifying a target of your choice. Leaving the target empty will show your own avatar instead.',
            usage: 'avatar [target]',
            example: ['avatar', 'avatar @Riya#0001', 'avatar guild', 'avatar server'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        // TODO: create command
    }
}

module.exports = new Avatar();