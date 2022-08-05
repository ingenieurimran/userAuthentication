// required modules
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

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
})
userSchema.plugin(passportLocalMongoose)
// mongoose Model
const User = mongoose.model('User', userSchema)
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get('/', (req, res) => {
  res.render('home')
})
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
