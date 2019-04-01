const KiramekiHelper = require('../../KiramekiHelper');

class Avatar {
    constructor() {
        this.name = 'avatar';
        this.category = KiramekiHelper.categories.GENERAL;
        this.owner = false;
        this.aliases = ['guildicon', 'useravatar', 'userimage'];
        this.help = {
            message: 'Request the avatar of a specified user, yourself, or the guild by specifying a target of your choice. Leaving the target empty will show your own avatar instead.',
            usage: 'avatar [target]',
            example: ['avatar', 'avatar @Riya#0001', 'avatar guild', 'avatar server'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const avatarEmbed       = new KiramekiHelper.Embed().setColor('DEFAULT').setTitle(`${KiramekiHelper.getUserTag(message.author)}'s Avatar`);

        if (!target) {
            avatarEmbed.setImage(message.author.dynamicAvatarURL('jpg', 1024));
            avatarEmbed.setDescription(`[Click here to expand in your browser](${message.author.dynamicAvatarURL('jpg', 1024)})`);
        } else if (target.toLowerCase() === 'guild' || target.toLowerCase() === 'server') {
            avatarEmbed.setImage(message.channel.guild.dynamicIconURL('jpg', 1024));
            avatarEmbed.setDescription(`[Click here to expand in your browser](${message.channel.guild.dynamicIconURL('jpg', 1024)})`);
        } else {
            // TODO: Implement user mentions
        }
    }
}

module.exports = new Avatar();