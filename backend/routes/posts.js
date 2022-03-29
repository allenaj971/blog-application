var express = require('express');
var router = express.Router();
const Post = require('../models/Post')
const User = require('../models/User')

const jwt = require('jsonwebtoken')

// get all posts
router.post('/', async (req, res) => {
  if (req.body.token) {
    // get all posts for the user
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      if (err) {
        res.status(401).json(err)
      } else {
        // send all user posts
        const currentUserPosts = await Post.find({ userid: payload.id }, (err) => {
          if (err) {
            return res.json(err)
          }
        })

        const followings = await User.findById(payload.id, 'followings')
        // console.log(followings)

        var followingsUserPosts = []

        for (var i = 0; i < followings.followings.length; i++) {
          // for each user, find their posts and sort by latest post first
          var post = await Post.find({ userid: followings.followings[i] })
          for (var j = 0; j < post.length; j++) {
            if (post[j]) {
              followingsUserPosts.push(post[j])
            }
          }
          // append each post to json body so that the react can 
          // interpret it correctly
        }

        // spreading the current user and their followings' posts
        var allPosts = [...followingsUserPosts, ...currentUserPosts]

        // sort posts by createdAt date
        allPosts.sort((a, b) => (a.createdAt > b.createdAt) ? -1 : 1)

        res.status(200).json(allPosts)
      }
    })
  } else {
    res.sendStatus(401)
  }
});

const returnProfile = 'followers followings email address firstname lastname email phoneNumber username'
// add post 
router.post('/addpost', async (req, res) => {
  // check for title and content otherwise send error
  if (!req.body.title || !req.body.content) {
    return res.sendStatus(400)
  }

  // if no token, send unauthorized
  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      // if jwt is expired, send unauthorized
      if (err) {
        return res.status(401).json(err)
      }
      // find user by id
      const profile = await User.findById(payload.id, returnProfile)
      req.body.firstname = profile.firstname
      req.body.lastname = profile.lastname
      req.body.username = profile.username
      req.body.userid = payload.id

      // post new post to db
      const newPost = await Post.create(req.body)
      res.json(newPost)
    })
  } else {
    res.sendStatus(401)
  }
})

router.put('/editpost', async (req, res) => {
  if (!req.body.postid) {
    return res.sendStatus(400)
  }

  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      // if jwt is expired, send unauthorized
      if (err) {
        return res.status(401).json(err)
      }
      // check if author is the one trying to edit post
      const actualAuthor = await Post.findById(req.body.postid)

      if (actualAuthor.userid === payload.id) {
        // edit post if authorized if userid matches json token userid
        const edited = await Post.findByIdAndUpdate(req.body.postid, { $set: req.body })
        res.json(edited)
      } else {
        res.sendStatus(401)
      }
    })

  } else {
    res.sendStatus(401)
  }

})

// delete post
router.post('/deletepost', async (req, res) => {
  if (!req.body.postid) {
    return res.sendStatus(404)
  }

  if (req.body.token) {
    jwt.verify(req.body.token, process.env.JWT, async (err, payload) => {
      // if jwt is expired, send unauthorized
      if (err) {
        return res.status(401).json(err)
      }

      // check if author is the one trying to edit post
      const actualAuthor = await Post.findById(req.body.postid)
      if (actualAuthor.userid = payload.id) {
        const deletePost = await Post.findByIdAndDelete(req.body.postid)
        if (deletePost) {
          res.sendStatus(200)
        } else {
          res.sendStatus(400)
        }
      } else {
        res.sendStatus(401)
      }
    })
  } else {
    res.sendStatus(401)
  }
})

module.exports = router;
