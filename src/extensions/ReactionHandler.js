const EventEmitter = require('eventemitter3');

class ReactionHandler extends EventEmitter {
    constructor(message, filter, options = {}) {
        super();
        this.client = (message.channel.guild) ? message.channel.guild.shard.client : message.channel._client;
        this.filter = filter;
        this.message = message;
        this.options = options;
        this.ended = false;
        this.collected = [];
        this.listener = (msg, emoji, userID) => this.verify(msg, emoji, userID);
        this.client.on('messageReactionAdd', this.listener);

        if (options.time) setTimeout(() => this.stop('time'), options.time);
    }

    /**
     * Verify a reaction for its validity with provided filters
     * @param {object} msg The message object 
     * @param {object} emoji The emoji object containing its name and its ID 
     * @param {string} userID The user ID of the user who's reacted 
     */
    verify(msg, emoji, userID) {
        if (this.message.id !== msg.id) {
            return false;
        }

        if (this.filter(userID)) {
            this.collected.push({ msg, emoji, userID });
            this.emit('reacted', { msg, emoji, userID });

            if (this.collected.length >= this.options.maxMatches) {
                this.stop('maxMatches');
                return true;
            }
        }

        return false;
    }

    /**
     * Stops collecting reactions and removes the listener from the client
     * @param {string} reason The reason for stopping
     */
    stop (reason) {
        if (this.ended) {
            return;
        }

        this.ended = true;
        this.client.removeListener('messageReactionAdd', this.listener);
        this.emit('end', this.collected, reason);
    }
}

module.exports = {
    continuousReactionStream: ReactionHandler,
    collectReactions: (message, filter, options) => {
        const collector = new ReactionHandler(message, filter, options);
        return new Promise(resolve => collector.on('end', resolve));
    }
};