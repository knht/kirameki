const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class ChangeMyMind {
    constructor() {
        this.name = 'changemymind';
        this.aliases = ['cmm'];
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.MEMES;
        this.cooldown = 15;
        this.help = {
            message: 'Generate a Change my Mind meme with custom specifiable text and authentic looks!',
            usage: 'changemymind <text>',
            example: 'changemymind Pepsi tastes better than Coke.',
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

        const canvas    = Canvas.createCanvas(399, 344);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.CHANGE_MY_MIND_BACKGROUND);

        // Draw Image
        ctx.drawImage(bgImg, 0, 0, 399, 344);

        // Draw Text
        ctx.font = 'bold 19px Arial Bold';
        ctx.fillStyle = '#2b2b2b';
        ctx.rotate(-22 * Math.PI / 180);
        KiramekiHelper.wrapCanvasText(ctx, args, 42, 233, 220, 18);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'CHANGE MY MIND', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new ChangeMyMind();