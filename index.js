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


const testAsync = Router()

const options = { default: { port: 8080, modo: 'fork' }, alias: { p: 'port', m: 'modo' } }
const args = require('minimist')(process.argv.slice(2), options)
// const args = require('minimist')(process.argv.slice(2))

mongoose.connect(process.env.MONGO_URI)

const PORT = args.port 
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
    const user = req.user
    res.render('profile', {
        'user': [
            user.email
        ]
    })
})

app.post('/register', passport.authenticate('register', { failureRedirect: '/failRegister' }), (req, res) => {
    console.log('Register ok')
    res.render('login')
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        console.log('Logout Success')
        res.render('login')
    })
})

app.get('/profile', (req, res) => {
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
    res.render('failedRegister')
})

app.get('/failedAuth', (req, res) => {
    res.render('failedAuth')
})

app.get('/info', (req, res) => {
    const p = args.p
    console.log(PORT)
    res.send({
        argInput: { p },
        SO: process.platform,
        vNode: process.version,
        rss: process.memoryUsage,
        pathExc: process.execPath,
        pID: process.pid,
        directory: process.cwd(),
        procesadores: numCPUs,
    })
})


testAsync.get('/randoms', (req, res) => {
    let { cant } = req.query
    if (!cant) {
        cant = 100000000
    }

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

// console.log(MODO)
// console.log(PORT)

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

