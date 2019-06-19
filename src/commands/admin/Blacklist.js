const KiramekiHelper = require('../../KiramekiHelper');

class Blacklist {
    constructor() {
        this.name = 'blacklist';
        this.subCommands = ['add', 'remove', 'list'];
        this.permissions = ['manageMessages', 'readMessageHistory'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.nsfw = true;
        this.cooldown = 3;
        this.help = {
            message: 'Blacklist words, emojis or sentences you don\'t want to appear in your guild. If a word is being added or removed it must be provided.',
            usage: 'blacklist <action[add|remove|list]> [word]',
            example: ['blacklist list', 'blacklist add badWord', 'blacklist remove badWord'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, action, word] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!action || !this.subCommands.includes(action.toLowerCase())) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        if (action.toLowerCase() !== 'list' && !word) {
            console.log('2');
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        switch (action.toLowerCase()) {
            case 'list': {
                const blacklistedWordsQuery = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE guild_id = ?;', [message.channel.guild.id]);
                let blacklistedWords = [];

                for (let blacklistedWord of blacklistedWordsQuery) {
                    blacklistedWords.push(`\`${blacklistedWord.word}\``);
                }

                if (blacklistedWordsQuery.length > 0) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle('Blacklist')
                        .setDescription(
                            `There's currently **${blacklistedWordsQuery.length} ${(blacklistedWordsQuery.length === 1) ? 'word' : 'words'}** blacklisted in guild **${message.channel.guild.name}**:\n\n` + 
                            blacklistedWords.join(', ')
                        )
                    );
                } else {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`There are no words blacklisted in guild **${message.channel.guild.name}**!`)
                    );
                }

                break;
            }

            case 'add': {
                const isWordAlreadyBlacklisted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE word = ? AND guild_id = ?;', [word, message.channel.guild.id]);

                if (isWordAlreadyBlacklisted.length > 0) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`**${word}** is already blacklisted on **${message.channel.guild.name}**!`)
                    );

                    break;
                } else {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO word_blacklist (id, guild_id, word) VALUES (NULL, ?, ?);', [message.channel.guild.id, word]);

                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`Successfully blacklisted **${word}** on **${message.channel.guild.name}**!`)
                    );

                    break;
                }
            }

            case 'remove': {
                const isWordAlreadyBlacklisted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE word = ? AND guild_id = ?;', [word, message.channel.guild.id]);

                if (isWordAlreadyBlacklisted.length > 0) {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM word_blacklist WHERE word = ? AND guild_id = ?;', [word, message.channel.guild.id]);

                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`Successfully removed **${word}** from the blacklist!`)
                    );

                    break;
                } else {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`**${word}** isn't blacklisted on **${message.channel.guild.name}**!`)
                    );

                    break;
                }
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'BLACKLIST', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Blacklist();