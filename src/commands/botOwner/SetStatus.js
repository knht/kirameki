const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');

class SetStatus {
    constructor() {
        this.name = 'setstatus';
        this.aliases = ['addstatus'];
        this.category = KiramekiHelper.categories.OWNER;
        this.owner = true;
        this.cooldown = 3;
        this.help = {
            message: `Set the status for the \`${KiramekiConfig.prefix}\` command.`,
            usage: 'setstatus <status> <statusMessage>',
            example: 'setstatus 0 Fully operational',
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, status, description] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const validStati = ['0', '1', '2'];

        if (!status || !validStati.includes(status)) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("RED")
                .setTitle("Please specify a valid status")
                .setDescription(
                    "`0` Fully Operational\n" + 
                    "`1` Restricted Operation\n" + 
                    "`2` Not Operational"
                )
            );
        }

        if (!description) return message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle("Please specify a valid description!"));

        try {
            const insertion = await Util.preparedAsyncMysqlQuery(
                kirAPI_DB, 
                'INSERT INTO status (id, status, date, description) VALUES (NULL, ?, ?, ?);', 
                [status, Math.floor(Date.now() / 1000), description]
            );

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("GREEN")
                .setTitle("Status Updater")
                .setDescription("The status has been updated successfully!")
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SET STATUS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
        } catch (mysqlError) {
            message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle("Something went wrong. Check logs for more information!"));
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'SET STATUS MYSQL ERROR', mysqlError);
        }
    }
}

module.exports = new SetStatus();