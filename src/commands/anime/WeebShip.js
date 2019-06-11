const KiramekiHelper = require('../../KiramekiHelper');
const uniqid = require('uniqid');
const Canvas = require('canvas');

class WeebShip {
    constructor() {
        this.name = 'ship';
        this.aliases = ['lovemeter'];
        this.permissions = ['attachFiles'];
        this.category = KiramekiHelper.categories.ANIME;
        this.cooldown = 15;
        this.help = {
            message: 'Calculate the love compatibility of two users you want to ship and receive a nice graphical representation.',
            usage: 'ship <firstUser> <secondUser>',
            example: 'ship @Riya#0001 @Kukai#7867',
            inline: false
        }
    }

    calculateLoveText(percentage) {
        const firstQuarter = [
            "You guys don't match at all!",
            "You'd be better off dating someone else ~",
            "I can't say I support this ..",
            "This will never work with you two ~",
            "Those two would be better off single .."
        ];

        const secondQuarter = [
            "You two won't make it further than dating!",
            "I think there's better partners for either of you ~",
            "I judge this ship to be ok! But are you happy?",
            "Meh, I think both of you could do better with someone else ..",
            "Ever thought of spicing things up with someone else? ~"
        ];

        const thirdQuarter = [
            "Fine couple indeed! You got my support!",
            "I ship you two to be together forever ~",
            "I'm glad you two found together in my name ~",
            "You guys make a super cute couple, indeed!",
            "You two seem to like each other a lot ~"
        ];

        const fourthQuarter = [
            "Cutest couple ever to be shipped, period!",
            "Never dare cheating on each other. This is perfect!",
            "You guys are a match made in heaven!",
            "I couldn't have shipped someone better than that ~"
        ];

        const pefect = [
            "Perfection. Absolute perfection!",
            "The best couple to be shipped ever!",
            "I hereby declare you waifu and husbando!"
        ];

        if (percentage == 100) {
            return pefect[Math.floor(Math.random() * pefect.length)];
        } else if (percentage >= 75) {
            return fourthQuarter[Math.floor(Math.random() * fourthQuarter.length)];
        } else if (percentage >= 50) {
            return thirdQuarter[Math.floor(Math.random() * thirdQuarter.length)];
        } else if (percentage >= 25) {
            return secondQuarter[Math.floor(Math.random() * secondQuarter.length)];
        } else {
            return firstQuarter[Math.floor(Math.random() * firstQuarter.length)];
        }
    }

    async execute(message, kirCore, cooldowns) {
        const userMentionArray = message.mentions;
        const lovePercentage = KiramekiHelper.randomIntFromInterval(1, 100);
        const loveQuote = this.calculateLoveText(lovePercentage);

        if (userMentionArray.length != 2) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify **exactly** 2 users you want to ship (｡’▽’｡)♡')
            );
        }

        const shipOne = userMentionArray[0];
        const shipTwo = userMentionArray[1];

        if (shipOne.bot || shipTwo.bot) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('I..I can\'t say I support shipping robots!')
            );
        }

        if (shipOne.id === kirCore.user.id || shipTwo.id === kirCore.user.id) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('I..I don\'t want to ship with humans! Thanks ( •⌄• ू )✧')
            );
        }

        Canvas.registerFont(__dirname + '/../../../fonts/Quicksand-Light.ttf', { family: 'Quicksand' });

        message.channel.sendTyping();

        const canvas        = Canvas.createCanvas(399, 137);
        const ctx           = canvas.getContext('2d');
        const bgImg         = await Canvas.loadImage(KiramekiHelper.images.LOVE_METER_OVERLAY);
        const userAvatarOne = await Canvas.loadImage(shipOne.dynamicAvatarURL('jpg', 128));
        const userAvatarTwo = await Canvas.loadImage(shipTwo.dynamicAvatarURL('jpg', 128));

        // Background Fill
        ctx.fillStyle = '#2d2d37';
        ctx.fillRect(0, 0, 399, 137);

        // Lovebar fill
        ctx.fillStyle = 'green';
        ctx.fillRect(114, 89, 167, 5);

        // Draw Avatar
        ctx.drawImage(userAvatarOne, 14, 12, 112, 112);

        // Draw Avatar 2
        ctx.drawImage(userAvatarTwo, 268, 12, 112, 112);

        // Draw Overlay
        ctx.drawImage(bgImg, 0, 0, 399, 137);

        // Draw Ship percentage
        ctx.font = "bold 28px Quicksand";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(lovePercentage + "%", 199, 73);

        await message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('#D76D8E')
            .setTitle(loveQuote)
        );
        
        message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB SHIP', `${KiramekiHelper.userLogCompiler(message.author)} used the ship command.`);
    }
}

module.exports = new WeebShip();