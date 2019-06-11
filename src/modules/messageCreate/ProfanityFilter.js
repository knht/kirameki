const KiramekiHelper = require('../../KiramekiHelper');

class ProfanityFilter {
    constructor() {
        this.name = 'profanityfilterMC';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;

        const wordExists        = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE guild_id = ?;', [message.guild.id]);
        const isMuted           = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM mute WHERE discord_id = ? AND guild_id = ?;', [message.author.id, message.channel.guild.id]);
        const sanitizedContent  = KiramekiHelper.sanitizeMarkdown(message.content);

        if (wordExists.length > 0) {
            for (let i = 0; i < wordExists.length; i++) {
                if (sanitizedContent.includes(wordExists[i].word.toLowerCase()) && !isMuted.length) {
                    return message.delete();
                }
            }
        }
    }
}

module.exports = new ProfanityFilter();