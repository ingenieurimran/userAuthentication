// required modules
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

// initilize app
const app = express()
// use app
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  }),
)
app.use(passport.initialize())
app.use(passport.session())
// mongoose connect
mongoose.connect('mongodb://localhost:27017/userSecurityDB')
// mongoose Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
// mongoose Model
const User = mongoose.model('User', userSchema)
passport.use(User.createStrategy())
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username, name: user.displayName })
  })
})

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user)
  })
})

// Google Auth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/secrets',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user)
      })
    },
  ),
)

app.get('/', (req, res) => {
  res.render('home')
})
// for rote google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets')
  },
)

app.get('/register', (req, res) => {
  res.render('register')
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('secrets')
  } else {
    res.redirect('/login')
  }
})

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (!err) {
      res.redirect('/')
    } else {
      console.log(err)
    }
  })
})

app.post('/register', (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (!err) {
        passport.authenticate('local')(req, res, () => {
          res.redirect('/secrets')
        })
      } else {
        res.redirect('/')
      }
    },
  )
})

app.post('/login', (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  })
  req.login(newUser, (err) => {
    if (!err) {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secrets')
      })
    } else {
      console.log(err)
    }
  })
})

app.listen(3000, () => {
  console.log('server is running on port 3000.')
})
