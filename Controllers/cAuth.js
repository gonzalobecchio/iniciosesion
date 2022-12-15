const { Logger }  =  require('../Log/Logger.js')
const log = new Logger({ level: 'info' })
const loggerConsole = log.getLogger()

cAuth = {
    login: async (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s', req.method, req.originalUrl)
        const user = req.user
        res.render('profile', {
            'user': [
                user.email
            ]
        })
    },
    register: async (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s', req.method, req.originalUrl)
        console.log('Register ok')
        res.render('login')
    },
    logout: (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s', req.method, req.originalUrl)
        req.logout((err) => {
            if (err) { return next(err); }
            console.log('Logout Success')
            res.render('login')
        })
    },
    //Obtiene la vista al formulario de Registro
    vRegister : (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
        if (!req.isAuthenticated()) {
            res.render('register')
            return
        }
        
        const user = req.user
        res.render('profile', {
            'user': [
                user.email
            ]
        })
        
    },
    failRegister: (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
        res.render('failedRegister')
    },
    faildedAuth:  (req, res) => {
        loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
        res.render('failedAuth')
    }
}

module.exports = { cAuth }
