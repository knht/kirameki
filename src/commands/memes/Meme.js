const KiramekiHelper = require('../../KiramekiHelper');

class Meme {
    constructor() {
        this.name = 'meme';
        this.aliases = ['memes', 'getmeme'];
        this.category = KiramekiHelper.categories.MEMES;
        this.nsfw = true;
        this.cooldown = 10;
        this.help = {
            message: 'Get a dank af meme from our custom meme database.',
            usage: 'meme',
            example: 'meme',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const randomMemeObject = await KiramekiHelper.query(kirCore.DB, 'SELECT meme_link FROM memes ORDER BY RAND() LIMIT 1;');
        const randomMemeURL = randomMemeObject[0].meme_link;

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setTitle("Your daily dose of fresh memes. 😂😂👌🏼💯🔥")
            .setImage(randomMemeURL)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MEMES', `${KiramekiHelper.userLogCompiler(message.author)} just requested a dank af meme.`);
    }
}

module.exports = new Meme();