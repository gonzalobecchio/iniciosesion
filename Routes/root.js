const express = require('express')
const { Router } = express
const root = Router()
const compression = require('compression')


root.get('/', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    
    if (!req.isAuthenticated()) {
        res.render('login', {'port': PORT, 'pid': process.pid})
        return
    }
    const user = req.user
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})

//User Controller?
root.get('/profile', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    if (!req.isAuthenticated()) {
        res.render('login')
        return
    }

    const user = req.user
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})


root.get('/info', compression(), (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    const p = args.p
    const info = {
        argInput: { p },
        SO: process.platform,
        vNode: process.version,
        rss: process.memoryUsage,
        pathExc: process.execPath,
        pID: process.pid,
        directory: process.cwd(),
        procesadores: numCPUs,
    }
    res.send(info)
})

module.exports = { root }