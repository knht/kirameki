const KiramekiHelper = require('../../KiramekiHelper');

class OsuEnableOCR {
    constructor() {
        this.name = 'osuocr';
        this.aliases = ['osuss', 'scorescreens'];
        this.subCommands = ['enable', 'disable'];
        this.permissions = ['externalEmojis'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.nsfw = false;
        this.cooldown = 5;
        this.help = {
            message: `Enable and disable the automatic processing of osu! Score Screens in the current channel. Read more about osu! Score Screen OCR on the [event modules page.](${KiramekiHelper.links.WEBSITE.EVENT_MODULES})`,
            usage: 'osuocr <action[enable|disable]>',
            example: ['osuocr enable', 'osuocr disable'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, action] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!action || !this.subCommands.includes(action.toLowerCase())) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const alreadyActivated = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_channel_ocr WHERE channel_id = ?;', [message.channel.id]);

        switch (action.toLowerCase()) {
            case 'enable': {
                if (alreadyActivated.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`osu! Score Screen OCR is already enabled in channel **${message.channel.name}**!`)
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO osu_channel_ocr (id, channel_id) VALUES (NULL, ?);', [message.channel.id]);

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle(`Successfully enabled Score Screen OCR for channel **${message.channel.name}**!`)
                );

                break;
            }

            case 'disable': {
                if (alreadyActivated.length < 1) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`osu! Score Screen OCR is already disabled in channel **${message.channel.name}**!`)
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM osu_channel_ocr WHERE channel_id = ?;', [message.channel.id]);

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle(`Successfully disabled Score Screen OCR for channel **${message.channel.name}**!`)
                );

                break;
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! OCR', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuEnableOCR();