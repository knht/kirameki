const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');

class BirthdaySystemMuter {
    constructor() {
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
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(kirCore, this.help));
        }

        // TODO: Write the birthday message muter
    }
}

module.exports = new BirthdaySystemMuter();