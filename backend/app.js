var express = require('express');
// log requests
var logger = require('morgan');
require('dotenv').config()
const mongoose = require('mongoose')
// allow httpOnly cookies
const cookieParser = require('cookie-parser');
// allow react app to access backend
const cors = require('cors')

// enable https for our server
var path = require('path')

var postRouter = require('./routes/posts');
var usersRouter = require('./routes/users');

var app = express();

mongoose.connect(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: false, useFindAndModify: true }, () => {
  console.log('Connected to MongoDB!')
})

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://ecstatic-swirles-ddf0b2.netlify.app');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
app.use(cookieParser());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use('/posts', postRouter);
app.use('/users', usersRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build/')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'))
  })
}



app.listen(process.env.PORT || 4000, () => {
  console.log(`Example app listening on port ${process.env.PORT}!`)
})


module.exports = app;
