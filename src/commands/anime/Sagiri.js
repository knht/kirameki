const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class Sagiri {
    constructor() {
        this.name = 'sagiri';
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 15;
        this.help = {
            message: 'Write onto **Sagiri\'s tablet!** This generates an image for you with the text provided written onto Sagiri\'s tablet.',
            usage: 'sagiri <text>',
            example: 'sagiri I love eating okonomiyaki!',
            inline: true
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!args) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        message.channel.sendTyping();
        Canvas.registerFont(__dirname + '/../../../fonts/GUTHEN.ttf', { family: 'GUTHEN' });

        const canvas    = Canvas.createCanvas(400, 308);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.SAGIRI_BACKGROUND);

        // Draw Sagiri
        ctx.drawImage(bgImg, 0, 0, 400, 308);

        // User Text
        ctx.font = 'bold 12px GUTHEN';
        ctx.fillStyle = '#2b2b2b';
        ctx.rotate(11 * Math.PI / 180);
        KiramekiHelper.wrapCanvasText(ctx, args, 137, 173, 124, 16);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SAGIRI CANVAS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Sagiri();