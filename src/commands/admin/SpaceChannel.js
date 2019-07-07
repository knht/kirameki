const KiramekiHelper = require('../../KiramekiHelper');

class SpaceChannel {
    constructor() {
        this.name = 'spacechannel';
        this.aliases = ['makechannelspace', 'space'];
        this.permissions = ['manageChannels'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.cooldown = 1;
        this.help = {
            message: 'Replace any hyphens (`-`) or underscores (`_`) in the channel name with real looking spaces!',
            usage: 'spacechannel',
            example: 'spacechannel',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const newChannelName = message.channel.name.replace(/\-|\_/g, '\u2009\u2009');

        message.channel.edit({ name: newChannelName });

        KiramekiHelper.createFlashEmbed(message, 5, new KiramekiHelper.Embed().setColor('GREEN').setTitle('Channel name was spaced successfully!'));
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SPACE CHANNEL', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new SpaceChannel();