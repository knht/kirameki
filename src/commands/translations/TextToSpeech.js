const KiramekiHelper = require('../../KiramekiHelper');

class TextToSpeech {
    constructor() {
        this.name = 'tts';
        this.aliases = ['texttospeech'];
        this.permissions = ['voiceConnect', 'voiceSpeak'];
        this.category = KiramekiHelper.categories.TRANSLATIONS;
        this.cooldown = 5;
        this.help = {
            message: `Let Kirameki join your active voice channel and speak the provided text in the provided language. You can see a list of all supported languages by [clicking here.](${KiramekiHelper.links.WEBSITE.TRANSLATIONS})`,
            usage: 'tts <language> <text>',
            example: ['tts ja 今日は暑いだよ', 'tts en I am bored'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, language, text] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        /**
         * @todo Implement LavaLink / Telecom voice nodes for fast multi guild voice synthesization
         */
        
        message.channe.createEmbed(new KiramekiHelper.Embed()
            .setColor('RED')
            .setTitle('This command is currently under maintenance.')
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'TEXT TO SPEECH', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new TextToSpeech();