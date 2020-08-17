const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class Trump {
    constructor() {
        this.name = 'trump';
        this.aliases = ['trumpinterview', 'jswan'];
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.MEMES;
        this.cooldown = 15;
        this.help = {
            message: 'Generate a "Donald Trump x Jonathan Swan" meme with custom specifiable text and authentic looks!',
            usage: 'trump <text>',
            example: 'trump owo is better than Kirameki.',
            inline: false
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!args) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        message.channel.sendTyping();
        Canvas.registerFont(__dirname + '/../../../fonts/ARIALBD.TTF', { family: 'Arial Bold' });

        const canvas    = Canvas.createCanvas(708, 837);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.TRUMP_BACKGROUND);

        // Draw Image
        ctx.drawImage(bgImg, 0, 0, 708, 837);

        // Draw Text
        ctx.font = 'bold 26px Arial Bold';
        ctx.fillStyle = '#2b2b2b';
        ctx.rotate(11 * Math.PI / 180);
        KiramekiHelper.wrapCanvasText(ctx, args, 475, 263, 300, 28);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'TRUMP INTERVIEW MEME', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}


module.exports = new Trump();