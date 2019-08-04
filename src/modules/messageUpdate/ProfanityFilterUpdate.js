const KiramekiHelper = require('../../KiramekiHelper');

class ProfanityFilterUpdate {
    constructor() {
        this.name = 'profanityfilterUC';
        this.wsEvent = 'MESSAGE_UPDATE';
    }

    async execute(message, oldMessage, kirCore) {
        if (!message) return;
        if (message.channel.type != 0) return;
        if (!message.author) return;
        if (message.author.bot) return;
        if (oldMessage === null) return;

        const wordExists        = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE guild_id = ?;', [message.guild.id]);
        const isMuted           = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM mute WHERE discord_id = ? AND guild_id = ?;', [message.author.id, message.channel.guild.id]);
        const sanitizedContent  = KiramekiHelper.sanitizeMarkdown(message.content);

        if (wordExists.length > 0) {
            for (let i = 0; i < wordExists.length; i++) {
                if (sanitizedContent.includes(wordExists[i].word.toLowerCase()) && !isMuted.length) {
                    return message.delete().catch((error) => {
                        KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'PROFANITY FILTER', `Couldn't delete message because of: ${error}`);
                    });
                }
            }
        }
    }
}

module.exports = new ProfanityFilterUpdate();