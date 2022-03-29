var express = require('express');
var router = express.Router();

const User = require('../models/User')
const Post = require('../models/Post')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
// const { update } = require('../models/User');
// const { response } = require('express');

router.post('/register', async (req, res, next) => {
  try {
    // console.log(req.body)
    // gen salt and edit req.body.password to contain hash
    var salt = await bcrypt.genSaltSync(10)
    req.body.password = await bcrypt.hashSync(req.body.password, salt)

    // push details to db, with hashed password
    const newUser = await User.create(req.body)

    if (newUser) {
      // return user id 
      res.sendStatus(200)
    } else {
      // return invalid inputs 
      res.sendStatus(400)
    }
    // catch some server errors
  } catch (err) {
    res.status(500).json(err)
  }
});

router.post('/login', async (req, res, next) => {
  // check if email and password are empty
  if (!req.body.email || !req.body.password) {
    return res.sendStatus(400)
  }

  // check for user in db
  const doesExist = await User.find({ email: req.body.email })

  // if there is no user send 404
  if (!doesExist[0]) {
    res.sendStatus(404)
    // if user exists, check pasword and send jwt 
  } else if (doesExist[0]) {

    // check password
    const verifyPassword = await bcrypt.compareSync(req.body.password, doesExist[0].password);
    if (verifyPassword) {
      const token = await jwt.sign({ id: doesExist[0]._id }, process.env.JWT, { expiresIn: '24hr' })

      res.status(200).json(token)
    } else {
      res.sendStatus(401)
    }
  }
})

// simple route to check if token is valid 
router.post('/isvalidtoken', async (req, res) => {
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      if (err) {
        res.sendStatus(401)
      } else {
        res.sendStatus(200)
      }
    })
  } else {
    res.sendStatus(401)
  }
})

// string to ensure password is not returned
const returnProfile = 'followers followings email address firstname lastname email phoneNumber username'
const returnUsers = 'followings followers username firstname lastname'
// const fllwings = 'username'

router.post('/profile', async (req, res) => {
  // if no token, send unauthorized
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      // if jwt invalid/expired, send unauthorized
      if (err) {
        return res.status(401).json(err)
        // else send profile details
      } else {
        const profile = await User.findById(payload.id, returnProfile)

        var followings = []
        for (var i = 0; i < profile.followings.length; i++) {
          var user = await User.findById(profile.followings[i], 'username')
          followings.push(user)
        }

        res.status(200).json({ profile, followings })
      }

    })

  } else {
    res.sendStatus(401)
  }
})

// edit profile
router.post('/editprofile', async (req, res) => {
  // if no jwt, send unauthorized
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      if (err) {
        // if jwt is expired send unauthorized
        return res.status(401).json(err)
      } else {
        // if request contains password, we need to salt and hash it before storing in db
        if (req.body.password) {
          // gen salt and edit req.body.password to contain hash
          var salt = await bcrypt.genSaltSync(10)
          req.body.password = await bcrypt.hashSync(req.body.password, salt)
        }

        // if err on update, send bad request (like username or email exists already as they must be unique)
        const updatedUser = await User.findByIdAndUpdate(payload.id, { $set: req.body })
          .catch(() => res.sendStatus(400))

        // if status code doesn't exist that means no error
        if (!updatedUser.statusCode) {
          //Updates all posts with new username, first or last names
          await Post.find({ userid: payload.id }).updateMany({ $set: req.body })
          res.sendStatus(200)
        }
      }
    })
  } else {
    res.sendStatus(401)
  }
})

// follow and unfollow other users
router.post('/follow/:id', async (req, res) => {
  const userBeingFollowed = req.params.id

  // if token not present then send unauthorized
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      if (err) {
        // if jwt is expired send unauthorized
        return res.status(401).json(err)
      } else {

        // find user id of user being followed 
        const useridvalid = await User.findById(userBeingFollowed, (err) => {
          if (err) {
            return res.status(404).json(err)
          }
        })

        // check if user is already following user
        const currentUser = await User.findById(payload.id)

        if (currentUser.followings.includes(useridvalid._id) === false) {
          await User.findByIdAndUpdate(payload.id, { $push: { followings: userBeingFollowed } })
          await User.findByIdAndUpdate(userBeingFollowed, { $push: { followers: payload.id } })
          res.sendStatus(201)
        } else {
          res.sendStatus(200)
        }
      }
    })
  } else {
    res.sendStatus(401)
  }
})

router.post('/unfollow/:id', async (req, res) => {
  const userBeingUnfollowed = req.params.id

  // if token not present then send unauthorized
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      if (err) {
        // if jwt is expired send unauthorized
        return res.status(401).json(err)
      } else {
        // find user id of user being followed 
        const useridvalid = await User.findById(userBeingUnfollowed, (err) => {
          if (err) {
            return res.status(404).json(err)
          }
        })
        // check if user is already following user
        const currentUser = await User.findById(payload.id)

        if (currentUser.followings.includes(useridvalid._id) === true) {
          await User.findByIdAndUpdate(payload.id, { $pull: { followings: userBeingUnfollowed } })
          await User.findByIdAndUpdate(userBeingUnfollowed, { $pull: { followers: payload.id } })
          res.sendStatus(201)
        } else {
          res.sendStatus(200)
        }
      }
    })
  } else {
    res.sendStatus(401)
  }
})


router.get('/findusers/:string', async (req, res) => {
  const string = req.params.string
  const regex = new RegExp(string)

  const findByUsername = await User.find({ username: regex }, returnUsers)
  // console.log(string)
  res.json(findByUsername)
  // res.sendStatus(200)
})



module.exports = router;
