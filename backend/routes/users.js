const express = require('express')
const passport = require('passport')
const router = express.Router()
const User = require('../models/users.js')

// Create a new user
router.post('/', async (req, res, next) => {
    let newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        instituion: req.body.instituion,
        email: req.body.email,
        password: req.body.password
    })

    if( await User.getUserByEmail(req.body.email) != null){
        return res.status(401).json({
            success: false,
            msg: 'Email already in use'
        })
    }

    const user = await User.addUser(newUser)
    res.status(201).json(user)
})

// Get user info -
// Return all info if the token matches the user id
// Return limited info otherwise
router.get('/:id', passport.authenticate('jwt',{session:false}), async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if (req.params.id === await req.user._id) {
        return res.json(user)
    }

    // Remove invites
    delete user.invites
    res.json(user)
})

// Update user info
router.put('/', passport.authenticate('jwt',{session:false}), async (req, res, next) => {

    user = await req.user

    let newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        instituion: req.body.instituion
    })

    user = await User.updateUser(user._id, newUser)

    res.status(200).json(user)
})

// Get user's invites
router.get('/invites', passport.authenticate('jwt',{session:false}), async (req, res, next) => {
    res.status(200).json({
        invites: await User.getInvites(await req.user._id)
    })
})

// Accept invite
router.post('/invites', passport.authenticate('jwt',{session:false}), async (req, res, next) => {

    let user = await req.user

    for( response in req.body.responses){
        if (response.accept == true){
            //accept the invite by adding the user to the team
            //will add once I have the function written
        }
        User.deleteInvite(await user._id,response.teamId)
    }

})

module.exports = router