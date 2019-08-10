const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class Hestia {
    constructor() {
        this.name = 'hestia';
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 15;
        this.help = {
            message: `Let Hestia from DanMachi write anything you want onto her piece of paper!`,
            usage: 'hestia <text>',
            example: 'hestia Garlic Bread is justice!',
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

        const canvas    = Canvas.createCanvas(639, 715);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.HESTIA_BACKGROUND);

        // Draw Hestia
        ctx.drawImage(bgImg, 0, 0, 639, 715);

        // User Text
        ctx.font = 'bold 22px GUTHEN';
        ctx.fillStyle = '#2a1a00';
        KiramekiHelper.wrapCanvasText(ctx, args, 229, 462, 225, 32);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'HESTIA CANVAS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Hestia();