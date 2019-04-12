const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class Kaede {
    constructor() {
        this.name = 'kaede';
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 15;
        this.help = {
            message: 'Write into **Kaede\'s diary!** This generates an image for you with the text provided written into Kaede\'s diary.',
            usage: 'kaede <text>',
            example: 'kaede I love pandas!',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!args) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        message.channel.sendTyping();
        Canvas.registerFont(__dirname + '/../../../fonts/GUTHEN.ttf', { family: 'GUTHEN' });

        const canvas    = Canvas.createCanvas(600, 561);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.KAEDE_BACKGROUND);

        // Draw Kaede
        ctx.drawImage(bgImg, 0, 0, 600, 561);

        // User Text
        ctx.font = 'bold 25px GUTHEN';
        ctx.fillStyle = '#2b2b2b';
        KiramekiHelper.wrapCanvasText(ctx, args, 86, 365, 245, 35);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'KAEDE CANVAS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Kaede();