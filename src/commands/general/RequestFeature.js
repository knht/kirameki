const KiramekiHelper = require('../../KiramekiHelper');

class RequestFeature {
    constructor() {
        this.name = 'requestfeature';
        this.aliases = ['request', 'featurerequest'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.owner = false;
        this.nsfw = false;
        this.cooldown = 1800;
        this.help = {
            message: 'Request a new feature you\'d like to have added in Kirameki.',
            usage: 'requestfeature <text>',
            example: 'requestfeature Please add private server support!',
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, featureRequest] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const featureRequestChannel = kirCore.guilds.get('464440032577716238').channels.get('540972369200545921');

        if (!featureRequest) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        }

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setTitle('Feature Request')
            .setThumbnail(KiramekiHelper.images.KIRAMEKI_MASCOT)
            .setDescription(`Hey there **${message.author.username}** and thanks for your request!\nYour feature request was posted successfully and users can now vote on the implementation! You can check the status of the request on the [official Kirameki Discord Guild.](${KiramekiHelper.links.INVITE})\n\nPlease bear in mind that this command can only be used every 30 minutes to prevent spamming. Thanks!`)
        );

        const sentMessage = await featureRequestChannel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setTitle('New Feature Request!')
            .setDescription('You can vote on this request now by reacting!')
            .setThumbnail(message.author.dynamicAvatarURL('jpg', 128))
            .addField('Discord User', `**${KiramekiHelper.getUserTag(message.author)}** *(ID: ${message.author.id})*`, false)
            .addField('Request', featureRequest)
            .setTimestamp()
        );

        await sentMessage.addReaction('⬆');
        await sentMessage.addReaction('⬇');

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'FEATURE REQUEST', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new RequestFeature();