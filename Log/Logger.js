const pino  = require('pino')

class Logger{
    constructor(options){
        this.options = options
    }

    getLogger(file = null){
        if (file) {
            return pino(this.options, pino.destination(`${__dirname}/${file}`))
        }
        return(pino(this.options))
    }
}
module.exports = { Logger } 