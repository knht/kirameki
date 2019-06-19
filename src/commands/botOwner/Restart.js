const KiramekiHelper = require('../../KiramekiHelper');

class Restart {
    constructor() {
        this.name = 'restart';
        this.permissions = ['manageMessages'];
        this.category = KiramekiHelper.categories.OWNER;
        this.owner = true;
        this.help = {
            message: 'Restart the main Node.js process including all spawned shards.',
            usage: 'restart',
            example: 'restart',
            inline: true
        }
    }

    /**
     * This "command" basically only exits the main Node.js process with a success exit code. Restarting the process is done by a process manager of your choice e.g. pm2
     */
    async execute(message, kirCore) {
        await message.delete();
        KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, 'RESTART', `${KiramekiHelper.userLogCompiler(message.author)} queued Kirameki for a restart.`);
        process.exit(0);
    }
}

module.exports = new Restart();