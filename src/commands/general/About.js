const KiramekiHelper = require('../../KiramekiHelper');
const juration = require('juration');

class About {
    constructor() {
        this.category = KiramekiHelper.categories.GENERAL;
        this.name = 'about';
        this.help = {
            message: 'Get general information about Kirameki and its infrastructure.',
            usage: 'about',
            example: 'about',
            inline: true
        }
    }

    async execute(message, kirCore) {
        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setTitle("About Kirameki")
            .setColor(0xFF9185)
            .setDescription(`[Kirameki](${KiramekiHelper.links.WEBSITE.BASE}) is a Discord bot made with lots of love by **Riya#0001**`)
            .addBlankField(false)
            .addField("Framework", "Eris", true)
            .addField("Environment", "Node.js", true)
            .addField("Languages", "JavaScript", true)
            .addField("Version", "2.0.0", true)
            .addField("Uptime", juration.stringify(kirCore.uptime / 1000, { format: 'micro', units: 2 }), true)
            .addField("Active Servers", kirCore.guilds.size, true)
            .addBlankField(false)
            .addField("Command List", `[Click Here](${KiramekiHelper.links.WEBSITE.COMMANDS})\nOr use \`${kirCore.prefix}commands\``, true)
            .addField("Homepage", `[kirameki.one](${KiramekiHelper.links.WEBSITE.BASE})`, true)
            .addField("Dashboard", `[Click Here](${KiramekiHelper.links.WEBSITE.DASHBOARD})`, true)
            .addField("Discord Server", `[Kirameki Help Guild](${KiramekiHelper.links.INVITE})`, true)
            .setThumbnail(KiramekiHelper.images.KIRAMEKI_MASCOT)
            .setFooter("Rocking 451 libraries, 19 API's and a lot of love ❤️")
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ABOUT', `${KiramekiHelper.userLogCompiler(message.author)} used the about command.`);
    }
}

module.exports = new About();