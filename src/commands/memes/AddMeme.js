const KiramekiHelper = require('../../KiramekiHelper');
const validUrl = require('valid-url');

class AddMeme {
    constructor() {
        this.name = 'addmeme';
        this.permissions = ['manageMessages'];
        this.category = KiramekiHelper.categories.MEMES;
        this.cooldown = 300;
        this.help = {
            message: 'Add a dank meme to our meme database. The URL provided must be a valid image link ending with either **.png** or **.jpg**',
            usage: 'addmeme <link>',
            example: ['addmeme https://img.kirameki.one/y8GpkTqR.png'],
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, memeURL] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const currentdate = new Date();
        const discordUserID = message.author.id;

        if (!memeURL) {
            cooldowns.get(this.name).delete(message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        }

        if (!validUrl.isWebUri(memeURL) || !KiramekiHelper.isValidImageURL(memeURL)) {
            cooldowns.get(this.name).delete(message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        }

        message.delete();

        const memeExists = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM memes WHERE meme_link = ?;', [memeURL]);

        if (memeExists.length > 0) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('It appears someone else already submitted this meme before you.')
            );
        }

        await KiramekiHelper.preparedQuery(
            kirCore.DB, 
            'INSERT INTO memes (id, meme_link, user_id, date) VALUES (NULL, ?, ?, ?);', 
            [memeURL, discordUserID, currentdate]
        );

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('GREEN')
            .setTitle('Success!')
            .setDescription('Your meme has been added successfully to our meme database!')
            .setImage(memeURL)    
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'ADD MEME', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new AddMeme();