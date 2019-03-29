const KiramekiHelper = require('../../KiramekiHelper');

class OsuSetup {
    constructor() {
        this.category = KiramekiHelper.categories.OSU;
        this.name = 'osusetup';
        this.aliases = ['osulink'];
        this.help = {
            message: 'Link your osu! account to your Discord account with Kirameki.',
            usage: 'osusetup <osuUsername>',
            example: 'osusetup BeasttrollMC'
        }
    }

    async execute(message, kirCore) {
        const [command, osuName] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!osuName) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Linking Setup", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    "This command is used to link your Discord account to your osu! account in order to use osu! commands without providing a username!\n\n**Usage:** `&osusetup <osuName>`\n\n**Example:** `&osusetup Riya`"
                )
            );
        }

        const osuUsername = osuName;
        const osuUserResult = await kirCore.osu.user.get(osuUsername, 0, undefined, 'string');

        if (!osuUserResult) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Linking Setup", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `Sorry but I'm afraid I wasn't able to find an active osu! account called **${osuName}**`
                )
            );
        }

        const sanitizedOsuUsername = osuUserResult.username;
        const sanitizedOsuID = osuUserResult.user_id;
        const sanitizedDiscordUsername = KiramekiHelper.addslashes(message.author.username.replace(/[^\x00-\x7F]/g, ""));
        const isAlreadyLinked = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);

        if (isAlreadyLinked) {
            KiramekiHelper.preparedQuery(
                kirCore.DB, 
                'UPDATE osu_discord_links SET discord_username = ?, osu_id = ?, osu_username = ? WHERE discord_id = ?;', 
                [sanitizedDiscordUsername, sanitizedOsuID, sanitizedOsuUsername, message.author.id]
            );

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Linking Setup", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `Discord account **${message.author.username}** (ID: **${message.author.id}**) has been linked successfully to the provided osu! account **${sanitizedOsuUsername}** (ID: **${sanitizedOsuID}**)\n\nYou are now able to use any osu! command without providing a username! Providing a username will overwrite your linkage and show information for the provided username instead! You can manage your osu! Linkage on the [Kirameki Dashbaord.](https://dashboard.kirameki.one)`
                )
            );
        } else {
            KiramekiHelper.preparedQuery(
                kirCore.DB,
                'INSERT INTO osu_discord_links (id, discord_id, discord_username, osu_id, osu_username) VALUES (NULL, ?, ?, ?, ?);',
                [message.author.id, sanitizedDiscordUsername, sanitizedOsuID, sanitizedOsuUsername]
            );

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor(0xF06DA8)
                .setAuthor("osu! Linking Setup", KiramekiHelper.images.OSU_LOGO)
                .setDescription(
                    `Discord account **${message.author.username}** (ID: **${message.author.id}**) has been linked successfully to the provided osu! account **${sanitizedOsuUsername}** (ID: **${sanitizedOsuID}**)\n\nYou are now able to use any osu! command without providing a username! Providing a username will overwrite your linkage and show information for the provided username instead! You can manage your osu! Linkage on the [Kirameki Dashbaord.](https://dashboard.kirameki.one)`
                )
            );
        }

        KiramekiHelper.updateOsuUser(kirCore.DB, osuUserResult);
        KiramekiHelper.updateOsuLeaderboards(kirCore.DB, message);
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! LINKAGE', `${KiramekiHelper.userLogCompiler(message.author)} just linked their Discord account to the osu! account ${sanitizedOsuUsername}.`);
    }
}

module.exports = new OsuSetup();