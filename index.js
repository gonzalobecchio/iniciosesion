/****************************************Dependencias****************************************/
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const { engine } = require('express-handlebars')
const mongoose = require('mongoose')
/****************************************Dependencias****************************************/

/******************************************Propio*******************************************/ 
const passport = require('./Auth/passport.js')
const { Logger } = require('./Log/Logger.js')
/******************************************Propio********************************************/ 

/********************************************Node********************************************/
const cluster = require('cluster')
const numCPUs = require('os').cpus().length
/********************************************Node********************************************/


/*************Routes*************/
const { auth } = require('./Routes/auth.js')
const { testAsync } = require('./Routes/test.js')
const { root } = require('./Routes/root.js')
/*************Routes*************/

/*******************************************Logs *******************************************/
const log = new Logger({ level: 'info' })
const loggeFileWarn = log.getLogger('warn.log')
const loggeFileError = log.getLogger('error.log')
const loggerConsole =log.getLogger({level: 'info'})
/*******************************************Logs *******************************************/


const options = { default: { port: 8081, modo: 'fork' }, alias: { p: 'port', m: 'modo' } }
const args = require('minimist')(process.argv.slice(2), options)


const PORT = args.port ?? process.env.PORT ?? 8081
const MODO = args.modo

mongoose.connect(process.env.MONGO_URI)

const app = express()

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

/***************************Routes***************************/
app.use(auth)
app.use('/api', testAsync)
app.use(root)
/***************************Routes***************************/

//Control de Errores
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


