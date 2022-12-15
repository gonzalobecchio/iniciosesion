const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { User } = require('../Persistence/Model/User.js')
const bcrypt = require('bcrypt')


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


module.exports = passport