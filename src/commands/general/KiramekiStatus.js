const KiramekiHelper = require('../../KiramekiHelper');
const moment = require('moment-timezone');

class KiramekiStatus {
    constructor() {
        this.name = 'status';
        this.category = KiramekiHelper.categories.GENERAL;
        this.permissions = ['externalEmojis'];
        this.help = {
            message: 'Get information about the current status of Kirameki.',
            usage: 'status',
            example: 'status',
            inline: true
        }
    }

    statusTextRender(statusCode) {
        let renderedStatus;

        switch (statusCode) {
            case 0:
                renderedStatus = `${KiramekiHelper.emojis.STATUS.OPERATIONAL} Fully Operational`;
            break;

            case 1:
                renderedStatus = `${KiramekiHelper.emojis.STATUS.RESTRICTED} Restricted Operation`;
            break;

            case 2:
                renderedStatus = `${KiramekiHelper.emojis.STATUS.UNOPERATIONAL} Not Operational`;
            break;
        }

        return renderedStatus;
    }

    async execute(message, kirCore) {
        const statusObject  = await KiramekiHelper.query(kirCore.DB, 'SELECT * FROM status ORDER BY id DESC LIMIT 1;');
        const statusDate    = moment.unix(statusObject[0].date);
        const currentStatus = parseInt(statusObject[0].status);
        const description   = statusObject[0].description;

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setThumbnail(KiramekiHelper.images.KIRAMEKI_MASCOT)
            .addField('Status', this.statusTextRender(currentStatus), true)
            .addField('Last Update', statusDate.format('LLL'), true)
            .addField('Description', description, false)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'STATUS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new KiramekiStatus();