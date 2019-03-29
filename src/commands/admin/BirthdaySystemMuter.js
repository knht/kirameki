const KiramekiHelper = require('../../KiramekiHelper');

class BirthdaySystemMuter {
    constructor() {
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.name = 'birthdaymessages';
        this.aliases = ['bdaymessages', 'xpmessages', 'xpmsgs', 'bdmsgs'];
        this.userPermissions = ['administrator'];
        this.help = {
            message: 'Disable and enable level up messages of the Birthday System!',
            usage: 'birthdaymessages <option[enable|disable]>',
            example: 'birthdaymessages enable'
        }
    }

    async execute(message, kirCore) {
        const [command, option] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        if (!option) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        }

        // TODO: Write the birthday message muter
    }
}

module.exports = new BirthdaySystemMuter();