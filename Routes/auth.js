const express = require('express')
const passport = require('../Auth/passport.js')
const { cAuth } = require('../Controllers/cAuth.js')

const { Router } = express

const auth = Router()

auth.post('/login', passport.authenticate('login', { failureRedirect: '/failedAuth' }), cAuth.login)

auth.post('/register', passport.authenticate('register', { failureRedirect: '/failRegister' }), cAuth.register)

auth.get('/logout', cAuth.logout)

auth.get('/register', cAuth.vRegister)

auth.get('/failRegister', cAuth.failRegister)

auth.get('/failedAuth', cAuth.faildedAuth)

module.exports = { auth }