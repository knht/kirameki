const ReactionHandler = require('./ReactionHandler');

class PaginationEmbed {
    constructor(message, pages = [], options = {}) {
        this.pages = pages;
        this.invoker = message;
        this.options = options;
        this.back = '⬅';
        this.forth = '➡';
        this.page = 1;
        this.message;
        this.handler;
    }

    async initialize() {
        if (this.pages.length < 2) {
            return Promise.reject('PaginationEmbedError: A Pagination Embed must contain at least 2 pages!');
        }

        this.message = await this.invoker.channel.createMessage({
            content: `Page **${this.page}** of **${this.pages.length}**`,
            embed: this.pages[this.page - 1]
        });

        this.handler = new ReactionHandler.continuousReactionStream(this.message, (userID) => userID === this.invoker.author.id, { maxMatches: 100, time: 300000 });

        await this.message.addReaction(this.back);
        await this.message.addReaction(this.forth);
    }

    run() {
        this.handler.on('reacted', async (event) => {
            switch (event.emoji.name) {
                case this.back: {
                    await this.message.removeReaction(this.back, this.invoker.author.id);

                    if (this.page > 1) {
                        this.page--;
                        this.message.edit({
                            content: `Page **${this.page}** of **${this.pages.length}**`,
                            embed: this.pages[this.page - 1]
                        });
                    }

                    break;
                }

                case this.forth: {
                    await this.message.removeReaction(this.forth, this.invoker.author.id);

                    if (this.page < this.pages.length) {
                        this.page++;
                        this.message.edit({
                            content: `Page **${this.page}** of **${this.pages.length}**`,
                            embed: this.pages[this.page - 1]
                        });
                    }

                    break;
                }
            }
        });
    }
}

module.exports = async (message, pages) => {
    const paginationEmbed = new PaginationEmbed(message, pages);
    await paginationEmbed.initialize();
    paginationEmbed.run();
};