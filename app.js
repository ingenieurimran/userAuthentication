// required modules
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10

// initilize app
const app = express()
// mongoose connect
mongoose.connect('mongodb://localhost:27017/userSecurityDB')
// mongoose Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})
// mongoose Model
const User = mongoose.model('User', userSchema)

// use app
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('home')
})
app.get('/register', (req, res) => {
  res.render('register')
})
app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/register', (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    })
    newUser.save((err) => {
      if (!err) {
        res.render('secrets')
      } else {
        consolelog(err)
      }
    })
  })
})

app.post('/login', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  User.findOne({ email: username }, (err, userFound) => {
    if (!err) {
      if (userFound) {
        bcrypt.compare(password, userFound.password, (err, result) => {
          if (result === true) {
            res.render('secrets')
          }
        })
      }
    } else {
      console.log(err)
    }
  })
})

app.listen(3000, () => {
  console.log('server is running on port 3000.')
})
