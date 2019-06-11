const KiramekiHelper = require('../../KiramekiHelper');

class SlotMachine {
    constructor() {
        this.name = 'slotmachine';
        this.aliases = ['slots'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.GAMBLING;
        this.cooldown = 3;
        this.help = {
            message: 'A simple slot machine game. 3 in a row wins!',
            usage: 'slotmachine',
            example: 'slotmachine',
            inline: true
        }
    }

    roll() {
        const slotMachineSymbols = [
            '🏵',
            '💎', '💎',
            '🍋', '🍋', '🍋',
            '🍉', '🍉', '🍉', '🍉',
            '❤️', '❤️', '❤️', '❤️', '❤️',
            '🥝', '🥝', '🥝', '🥝', '🥝', '🥝',
            '🔔', '🔔', '🔔','🔔', '🔔', '🔔','🔔',
            '🍎', '🍎', '🍎', '🍎', '🍎', '🍎','🍎', '🍎',
            '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒',
            '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒',
            '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒'
        ];

        let rowOne      = [];
        let rowTwo      = [];
        let rowThree    = [];

        for (let i = 0; i < 3; i++) {
            rowOne.push(slotMachineSymbols[Math.floor(Math.random() * slotMachineSymbols.length)]);
            rowTwo.push(slotMachineSymbols[Math.floor(Math.random() * slotMachineSymbols.length)]);
            rowThree.push(slotMachineSymbols[Math.floor(Math.random() * slotMachineSymbols.length)]);
        }

        let slotMatrix = {
            firstRow: rowOne,
            secondRow: rowTwo,
            thirdRow: rowThree
        }

        return slotMatrix;
    }

    hasWon(playfieldRow) {
        return (playfieldRow[0] === playfieldRow[1] && playfieldRow[0] === playfieldRow[2]);
    }

    async execute(message, kirCore) {
        const playfieldMatrix = this.roll();
        const hasWon = this.hasWon(playfieldMatrix.secondRow);
        const outcome = (hasWon) ? 'Congratulations, you **won!**' : 'Sorry, you **lost** this time!';

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setTitle('🎰 Slot Machine')
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(
                `⬛ ${playfieldMatrix.firstRow[0]} • ${playfieldMatrix.firstRow[1]} • ${playfieldMatrix.firstRow[2]} ⬛\n` + 
                `➡ ${playfieldMatrix.secondRow[0]} • ${playfieldMatrix.secondRow[1]} • ${playfieldMatrix.secondRow[2]} ⬅\n` + 
                `⬛ ${playfieldMatrix.thirdRow[0]} • ${playfieldMatrix.thirdRow[1]} • ${playfieldMatrix.thirdRow[2]} ⬛\n\n` +
                outcome 
            )
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SLOT MACHINE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new SlotMachine();