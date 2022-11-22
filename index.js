// https://github.com/gonzalobecchio/iniciosesion 

require('dotenv').config()
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const { engine } = require('express-handlebars')
const { Router } = express

const { fork } = require('child_process')

const cluster = require('cluster')
const numCPUs = require('os').cpus().length

const compression = require('compression')

/*******************************************Logs *******************************************/
const pino = require('pino')
const loggeFileWarn = pino({level: 'warn'}, pino.destination(`${__dirname}/warn.log`))
const loggeFileError = pino({level: 'error'}, pino.destination(`${__dirname}/error.log`))
const loggerConsole = pino({level: 'info'})
/*******************************************Logs *******************************************/

const testAsync = Router()

const options = { default: { port: 8081, modo: 'fork' }, alias: { p: 'port', m: 'modo' } }
const args = require('minimist')(process.argv.slice(2), options)

mongoose.connect(process.env.MONGO_URI)

const PORT = args.port || 8081
const MODO = args.modo


const User = mongoose.model('User', new mongoose.Schema({
    email: {
        type: "String",
        // required: true
    },
    password: {
        type: "String",
        // required: true
    },
    salt: {
        type: "String",
        // required: true
    }

}))


const app = express()

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(`${__dirname}/public`))

app.use(session({
    secret: process.env.MY_SECRET,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 600000
    },
    rolling: true,
    resave: true,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())


passport.use('login', new LocalStrategy({
    usernameField: 'email'
},
    async (email, password, done) => {
        const userFound = await User.findOne({ email }).exec()

        // console.log(userFound)
        if (!userFound) {
            console.log(`User not found ${email}`)
            return done(null, false)
        }

        const isMatch = await bcrypt.compare(password, userFound.password)
        // console.log(isMatch)

        if (!isMatch) {
            console.log('Invalid Password!')
            return done(null, false)
        }

        return done(null, userFound)
    }
))



passport.use('register', new LocalStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    if (!email || !password) {
        done(null, false)
    }
    const userFound = await User.findOne({ email }).exec()
    // console.log(userFound)
    if (userFound) {
        console.log(`Usuario ${userFound.email} already exists`)
        return done(null, false)
    }

    try {
        const salt = await bcrypt.genSalt()
        const hash = await bcrypt.hash(password, salt)

        const newUser = new User({ email, password: hash })
        newUser.save()
        console.log('User created succeful')
        done(null, newUser)
    } catch (error) {
        console.log(error)
    }
}
))

passport.serializeUser(function (userFound, done) {
    done(null, userFound._id);
});

passport.deserializeUser(async function (_id, done) {
    const user = await User.findById(_id)
    done(null, user);
});

app.get('/', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    
    if (!req.isAuthenticated()) {
        res.render('login', {'port': PORT, 'pid': process.pid})
        return
    }
    const user = req.user
    // console.log(user)
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})

app.get('/register', (req, res) => {
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
    
})

app.post('/login', passport.authenticate('login', { failureRedirect: '/failedAuth' }), (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    const user = req.user
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})

app.post('/register', passport.authenticate('register', { failureRedirect: '/failRegister' }), (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    console.log('Register ok')
    res.render('login')
})

app.get('/logout', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    req.logout((err) => {
        if (err) { return next(err); }
        console.log('Logout Success')
        res.render('login')
    })
})

app.get('/profile', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    if (!req.isAuthenticated()) {
        res.render('login')
        return
    }

    // console.log(req.user)
    const user = req.user
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})


app.get('/failRegister', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    res.render('failedRegister')
})

app.get('/failedAuth', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    res.render('failedAuth')
})

function hola() {
    console.log('Holaaaaaa')
}

app.get('/info', compression(), (req, res) => {
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
    // console.log(info)
    res.send(info)
})


testAsync.get('/randoms', (req, res) => {
    loggerConsole.info('METHOD: %s - URL: %s' , req.method, req.originalUrl)
    let { cant } = req.query
    if (!cant) {
        cant = 100000000
    }

    //Desactivado por consigna
    const forked = fork('./child.js')

    forked.send(cant)

    forked.on('message', unicos => {
        console.log(PORT)
        res.send(unicos)
        // res.render('register', {'port': PORT})
    })
    // res.send(PORT)
})

app.use('/api', testAsync)

app.get('*', (req, res) => {
    loggeFileWarn.warn({message: `Recurso Inexistente`}, 'METHOD: %s - URL: %s' , req.method, req.originalUrl)
    loggerConsole.warn({message: `Recurso Inexistente`}, 'METHOD: %s - URL: %s' , req.method, req.originalUrl)
    
    console.log(req.originalUrl)
    res.send(`Recurso inexistente ${req.method} ${req.originalUrl}`)
})

if (MODO == 'cluster') {

    if (cluster.isMaster) {
        console.log(`PID MASTER ${process.pid}`)

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork()
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died`)
        })
    } else {
        app.listen(PORT, () => { console.log(`Corriendo en Puerto ${PORT}`) })
        console.log(`Worker ${process.pid} started`)
    }
} else {
    app.listen(PORT, () => { console.log(`Corriendo en Puerto ${PORT}`) })
    console.log(`Process ${process.pid} started`)
    
}

// app.listen(PORT, () => { console.log(`Corriendo en Puerto ${PORT}`) })

