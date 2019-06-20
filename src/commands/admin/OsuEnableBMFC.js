const KiramekiHelper = require('../../KiramekiHelper');

class OsuEnableBMFC {
    constructor() {
        this.name = 'osubmfc';
        this.aliases = ['bmfc', 'osuflashcards', 'beatmapcards', 'flashcards'];
        this.subCommands = ['enable', 'disable'];
        this.permissions = ['externalEmojis'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.nsfw = false;
        this.cooldown = 5;
        this.help = {
            message: `Enable and disable the automatic creation of osu! Beatmap Flahscards in the current channel. Read more about osu! Beatmap Flashcards on the [event modules page.](${KiramekiHelper.links.WEBSITE.EVENT_MODULES})`,
            usage: 'osubmfc <action[enable|disable]>',
            example: ['osubmfc enable', 'osubmfc disable'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, action] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!action || !this.subCommands.includes(action.toLowerCase())) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const alreadyActivated = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM osu_bmlink_cards WHERE channel_id = ?;', [message.channel.id]);

        switch (action.toLowerCase()) {
            case 'enable': {
                if (alreadyActivated.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`osu! Beatmap Flashcards are already enabled in channel **${message.channel.name}**!`)
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO osu_bmlink_cards (id, channel_id) VALUES (NULL, ?);', [message.channel.id]);

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle(`Successfully enabled Beatmap Flashcards for channel **${message.channel.name}**!`)
                );

                break;
            }

            case 'disable': {
                if (alreadyActivated.length < 1) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`osu! Beatmap Flashcards are already disabled in channel **${message.channel.name}**!`)
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM osu_bmlink_cards WHERE channel_id = ?;', [message.channel.id]);

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle(`Successfully disabled Beatmap Flashcards for channel **${message.channel.name}**!`)
                );

                break;
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! BMFC', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuEnableBMFC();