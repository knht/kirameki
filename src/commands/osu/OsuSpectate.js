const KiramekiHelper = require('../../KiramekiHelper');

class OsuSpectate {
    constructor() {
        this.name = 'spectate';
        this.aliases = ['osuspec', 'osuspectate'];
        this.category = KiramekiHelper.categories.OSU;
        this.cooldown = 3;
        this.help = {
            message: 'Generate an osu! spectator mode link and immediately start spectating someone playing right now directly from within Discord!',
            usage: 'spectate <username>',
            example: 'spectate nathan on osu',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!osuName) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const userResults = await kirCore.osu.user.get(osuName, 0, undefined, 'string');

        if (!userResults) {
            return message.channel.createEmbed(KiramekiHelper.generateOsuUserNotFoundEmbed('osu! Spectate', osuName));
        }

        const kirAPILink = KiramekiHelper.links.WEBSITE.API.OSU.generateSpectatorLink(userResults.user_id);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setAuthor('osu! Live Spectate', KiramekiHelper.images.OSU_LOGO, kirAPILink)
            .setDescription(`[Start spectating ${userResults.username} now!](${kirAPILink})`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! SPECTATE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuSpectate();