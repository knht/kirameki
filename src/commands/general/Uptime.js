const KiramekiHelper = require('../../KiramekiHelper');
const juration = require('juration');

class Uptime {
    constructor() {
        this.name = 'uptime';
        this.category = KiramekiHelper.categories.GENERAL;
        this.help = {
            message: 'Check Kirameki\'s current uptime for your shard.',
            usage: 'uptime',
            example: 'uptime',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const uptime = juration.stringify(kirCore.uptime / 1000, { format: 'long', units: 3 });

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setTitle('Kirameki Uptime')
            .setDescription(`This shard has been continuously running for: **${uptime}**`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'UPTIME', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Uptime();