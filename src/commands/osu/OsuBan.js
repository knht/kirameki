const KiramekiHelper = require('../../KiramekiHelper');

class OsuBan {
    constructor() {
        this.name = 'osuban';
        this.category = KiramekiHelper.categories.OSU;
        this.owner = false;
        this.aliases = ['osub', 'osubanned'];
        this.help = {
            message: 'Check if a user is banned on the official osu! server.',
            usage: 'osuban <username>',
            example: 'osuban Ayreth',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, username] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!username) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));

        const osuUser = await kirCore.osu.user.get(username, 0, undefined, 'string');

        /**
         * APRIL FOOLS
         */
        if (!osuUser) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Ban Checker', KiramekiHelper.images.OSU_LOGO)
                .setDescription(`**Looking Good!** User **${(!osuUser) ? username : osuUser.username}** (ID: ${(!osuUser) ? 69420727 : osuUser.user_id}) isn't restricted!`)
            );
        } else {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setAuthor('osu! Ban Checker', KiramekiHelper.images.OSU_LOGO)
                .setDescription(`User **${username}** seems to be restricted right now **or** you may have made a typo.`)
            );
        }

        // if (osuUser) {
        //     message.channel.createEmbed(new KiramekiHelper.Embed()
        //         .setColor('OSU')
        //         .setAuthor('osu! Ban Checker', KiramekiHelper.images.OSU_LOGO)
        //         .setDescription(`**Looking Good!** User **${osuUser.username}** (ID: ${osuUser.user_id}) isn't restricted!`)
        //     );
        // } else {
        //     message.channel.createEmbed(new KiramekiHelper.Embed()
        //         .setColor('OSU')
        //         .setAuthor('osu! Ban Checker', KiramekiHelper.images.OSU_LOGO)
        //         .setDescription(`User **${username}** seems to be restricted right now **or** you may have made a typo.`)
        //     );
        // }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! BAN', `${KiramekiHelper.userLogCompiler(message.author)} used the osu! Ban command.`);
    }
}

module.exports = new OsuBan();