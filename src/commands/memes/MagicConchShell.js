const KiramekiHelper = require('../../KiramekiHelper');

class MagicConchShell {
    constructor() {
        this.name = 'conch';
        this.aliases = ['magicshell', 'conchshell', 'mcs', '8ball'];
        this.category = KiramekiHelper.categories.MEMES;
        this.help = {
            message: 'Ask the Magic Conch Shell from SpongeBob Squarepants a question and receive true enlightenment. The shell is always right and predicts the future 100% reliably. *cough*',
            usage: 'conch <question>',
            example: 'conch Can I have something to eat?',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, question] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const predictions = KiramekiHelper.other.MAGIC_CONCH_SHELL.PREDICTIONS;
        const prediction = predictions[KiramekiHelper.randomIntFromInterval(0, predictions.length - 1)];

        if (!question) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setDescription('The magic conch shell has spoken!')
            .setAuthor('Magic Conch Shell', KiramekiHelper.images.MAGIC_CONCH_SHELL.ICON)
            .setThumbnail(KiramekiHelper.images.MAGIC_CONCH_SHELL.THUMBNAIL)
            .addField('Question', question, false)
            .addField('Answer', `***${prediction}***`, false)
            .setFooter(`The magic conch shell was asked by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 128))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MAGIC CONCH SHELL', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new MagicConchShell();