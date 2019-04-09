const KiramekiHelper = require('../../KiramekiHelper');

class Cutie {
    constructor() {
        this.name = 'cutie';
        this.aliases = ['animal', 'animals'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 5;
        this.help = {
            message: 'Get a random cute image of either a puppy or a cat. The species is specifiable and defaults to random.',
            usage: 'cutie <species>',
            example: ['cutie dog', 'cutie cat'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, species] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const animals = ['animal_cat', 'animal_dog'];
        const valid = ['dog', 'dogs', 'cat', 'cats'];
        let animal;

        if (!species || !valid.includes(species.toLowerCase())) {
            animal = animals[Math.floor(Math.random() * animals.length)];
        } else {
            animal = `animal_${species.substring(0, 3)}`;
        }

        const result = await KiramekiHelper.getRandomAnimeImage(animal);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setImage(result.url)
            .setFooter(`This cute animal was requested by ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 128))
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'CUTIE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Cutie();