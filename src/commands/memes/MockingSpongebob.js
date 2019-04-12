const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class MockingSpongebob {
    constructor() {
        this.name = 'mock';
        this.aliases = ['getmock', 'msb', 'spongemock'];
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.MEMES;
        this.cooldown = 15;
        this.help = {
            message: 'Generate a **Mocking SpongeBob** meme with custom specifiable top text and bottom text. The top text and bottom text are split apart by a  **+** symbol.',
            usage: 'mock <topText>+<bottomText>',
            example: 'mock Look Squidward+I am cleaning',
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!args || !args.includes('+')) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const splitText     = args.split('+', 2);
        const topText       = splitText[0].split('');
        const bottomText    = splitText[1].split('');

        for (let i = 2; i < topText.length - 1; i += 2) {
            topText[i] = topText[i].toUpperCase();
        }

        for (let j = 2; j < bottomText.length - 1; j += 2) {
            bottomText[j] = bottomText[j].toUpperCase();
        }

        message.channel.sendTyping();
        Canvas.registerFont(__dirname + '/../../../fonts/impact.ttf', { family: 'Impact' });

        const canvas    = Canvas.createCanvas(501, 353);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.SPONGEMOCK_BACKGROUND);

        // Draw Background
        ctx.drawImage(bgImg, 0, 0, 501, 353);

        // Draw Top Text
        ctx.textAlign = 'center';
        ctx.font = 'bold 60px Impact';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(topText.join(''), 250.5, 60, 480);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(topText.join(''), 250.5, 60, 480);

        // Draw Bottom Text
        ctx.textAlign = 'center';
        ctx.font = 'bold 60px Impact';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(bottomText.join(''), 250.5, 342, 480);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(bottomText.join(''), 250.5, 342, 480);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SPONGEMOCK', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new MockingSpongebob();