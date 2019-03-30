const KiramekiHelper = require('../../KiramekiHelper');

class CommandList {
    constructor() {
        this.name = 'commands';
        this.category = KiramekiHelper.categories.GENERAL;
        this.owner = false;
        this.aliases = ['commandlist', 'cmds'];
        this.help = {
            message: 'Get a full list of all available commands categorized.',
            usage: 'commands',
            example: 'commands',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const osuCommands           = kirCore.commands.filter(osuCommand => osuCommand.category === KiramekiHelper.categories.OSU).map(c => `\`${c.name}\``);
        const gameProfileCommands   = kirCore.commands.filter(gameProfileCommand => gameProfileCommand.category === KiramekiHelper.categories.GAMES).map(c => `\`${c.name}\``);
        const generalCommands       = kirCore.commands.filter(generalCommand => generalCommand.category === KiramekiHelper.categories.GENERAL).map(c => `\`${c.name}\``);
        const memeCommands          = kirCore.commands.filter(memeCommand => memeCommand.category === KiramekiHelper.categories.MEMES).map(c => `\`${c.name}\``);
        const animeCommands         = kirCore.commands.filter(animeCommand => animeCommand.category === KiramekiHelper.categories.ANIME).map(c => `\`${c.name}\``);
        const gamblingCommands      = kirCore.commands.filter(gamblingCommand => gamblingCommand.category === KiramekiHelper.categories.GAMBLING).map(c => `\`${c.name}\``);
        const translationCommands   = kirCore.commands.filter(translationCommand => translationCommand.category === KiramekiHelper.categories.TRANSLATIONS).map(c => `\`${c.name}\``);
        const managementCommands    = kirCore.commands.filter(managementCommand => managementCommand.category === KiramekiHelper.categories.MANAGEMENT).map(c => `\`${c.name}\``);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor("DEFAULT")
            .setThumbnail(KiramekiHelper.images.KIRAMEKI_MASCOT)
            .setTitle('Kirameki Commands')
            .setDescription(`For detailed information run \`${kirCore.prefix}help <commandName>\` or visit our website over at [kirameki.one](${KiramekiHelper.links.WEBSITE.BASE}) for more information.`)
            .addField('osu! Commands', (osuCommands.length) ? osuCommands.join(', ') : 'No commands yet', false)
            .addField('Game Profile Commands', (gameProfileCommands.length) ? gameProfileCommands.join(', ') : 'No commands yet', false)
            .addField('Useful & Miscellaneous', (generalCommands.length) ? generalCommands.join(', ') : 'No commands yet', false)
            .addField('Memes & Fun', (memeCommands.length) ? memeCommands.join(', ') : 'No commands yet', false)
            .addField('Anime & Fun', (animeCommands.length) ? animeCommands.join(', ') : 'No commands yet', false)
            .addField('Gambling', (gamblingCommands.length) ? gamblingCommands.join(', ') : 'No commands yet', false)
            .addField('Translations & TTS', (translationCommands.length) ? translationCommands.join(', ') : 'No commands yet', false)
            .addField('Management', (managementCommands.length) ? managementCommands.join(', ') : 'No commands yet', false)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'COMMANDS', `${KiramekiHelper.userLogCompiler(message.author)} requested the command list!`);
    }
}

module.exports = new CommandList();