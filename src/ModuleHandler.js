const KiramekiHelper = require('./KiramekiHelper');

class ModuleHandler {
    constructor(kirCore) {
        this.kirCore = kirCore;
    }

    handle(message, modules) {
        modules.forEach(module => {
            module.execute(message, this.kirCore);
        });
    }
}

module.exports = ModuleHandler;