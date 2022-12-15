const express = require('express')
const { fork } = require('child_process')


const { Router } = express

testAsync = Router()

testAsync.get('/randoms', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    let { cant } = req.query
    if (!cant) {
        cant = 100000000
    }

    //Desactivado por consigna
    const forked = fork('../child.js')

    forked.send(cant)

    forked.on('message', unicos => {
        console.log(PORT)
        res.send(unicos)
        // res.render('register', {'port': PORT})
    })
    // res.send(PORT)
})

module.exports = { testAsync }