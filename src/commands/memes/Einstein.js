const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class Einstein {
    constructor() {
        this.name = 'einstein';
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.MEMES;
        this.cooldown = 15;
        this.help = {
            message: 'Force Einstein to scribble a text of your liking onto his blackboard. He\'s at your command.',
            usage: 'einstein <text>',
            example: 'einstein PewDiePie has no legs.',
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
        Canvas.registerFont(__dirname + '/../../../fonts/ReenieBeanie.ttf', { family: 'ReenieBeanie' });

        const canvas    = Canvas.createCanvas(400, 291);
        const ctx       = canvas.getContext('2d');
        const bgImg     = await Canvas.loadImage(KiramekiHelper.images.EINSTEIN_BACKGROUND);

        // Draw Image
        ctx.drawImage(bgImg, 0, 0, 400, 291);

        // Draw Text
        ctx.font = 'bold 29px ReenieBeanie';
        ctx.fillStyle = '#cecece';
        KiramekiHelper.wrapCanvasText(ctx, args, 148, 27, 248, 25);

        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'EINSTEIN CANVAS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Einstein();