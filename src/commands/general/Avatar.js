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
        const avatarEmbed       = new KiramekiHelper.Embed().setColor('DEFAULT');

        if (!target) {
            avatarEmbed.setTitle(`${KiramekiHelper.getUserTag(message.author)}'s Avatar`);
            avatarEmbed.setImage(message.author.dynamicAvatarURL('jpg', 1024));
            avatarEmbed.setDescription(`[Click here to expand in your browser](${message.author.dynamicAvatarURL('jpg', 1024)})`);
        } else if (target.toLowerCase() === 'guild' || target.toLowerCase() === 'server') {
            avatarEmbed.setTitle(`${message.channel.guild.name}'s Avatar`)
            avatarEmbed.setImage(message.channel.guild.dynamicIconURL('jpg', 1024));
            avatarEmbed.setDescription(`[Click here to expand in your browser](${message.channel.guild.dynamicIconURL('jpg', 1024)})`);
        } else {
            const mentionedUser = message.mentions[0] || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());
            
            if (!mentionedUser) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle('Couldn\'t find the user specified. Maybe try a mention?')
                );
            }

            const taggedUser = (!mentionedUser.user) ? mentionedUser : mentionedUser.user;

            avatarEmbed.setTitle(`${KiramekiHelper.getUserTag(taggedUser)}'s Avatar`);
            avatarEmbed.setImage(taggedUser.dynamicAvatarURL('jpg', 1024));
            avatarEmbed.setDescription(`[Click here to expand in your browser](${taggedUser.dynamicAvatarURL('jpg', 1024)})`);
        }

        message.channel.createEmbed(avatarEmbed);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'AVATAR', `${KiramekiHelper.userLogCompiler(message.author)} used the avatar command.`);
    }
}

module.exports = new Avatar();