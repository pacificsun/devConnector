const express  = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

const Profile = require('../../models/Profile')
const User = require('../../models/User')
const auth = require('../../middleware/auth')
// @route GET api/profile/me
// @desc get current users profile
// @acess Private

router.get('/me',auth , async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'there is no profile for this user'})
        }
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route POST api/profile
// @desc create or update user profile 
// @acess Private
router.post('/',
[auth,
    [ 
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skills is required').not().isEmpty()
    ]
], 
async (req, res) =>{
   const errors = validationResult(req);
   if(!errors.isEmpty()){
       return res.status(400).json({ errors: errors.array()});
   }
   const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    instagram,
    linkedin,
    twitter

   } = req.body

   // Build Profile  object
   const profileFields = {};
   profileFields.user = req.user.id;
   if(company) profileFields.company = company;
   if(website) profileFields.website = website;
   if(location) profileFields.location = location;
   if(bio) profileFields.bio = bio;
   if(status) profileFields.status = status;
   if(githubusername) profileFields.githubusername = githubusername;
   if(youtube) profileFields.youtube = youtube;
   if(facebook) profileFields.facebook = facebook;
   if(instagram) profileFields.instagram = instagram;
   if(linkedin) profileFields.linkedin = linkedin;
   if(twitter) profileFields.twitter = twitter;
   if(skills) 
    {
       profileFields.skills = skills.split(',').map(skill => skill.trim());
       console.log(profileFields.skills)
     //  res.send('hello');
    }

    // Build Social object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(twitter) profileFields.social.twitter = twitter;
     
    try {
        //req.user.id is from  token
        let profile = await Profile.findOne({ user: req.user.id });
        if(profile){
            //update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true}
            );
            return res.json(profile);
        }
        // Create 
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
}
);

// @route GET api/profile
// @desc  Get all profiles
// @acess Public
router.get('/', 
async(req, res) =>{
 try {
     const profiles = await Profile.find().populate('user',['name', 'avatar']);
     res.json(profiles);
 } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
 }
});

// @route GET api/profile/user/:user_id
// @desc  Get profileb by user ID
// @acess Public
router.get('/user/:user_id', 
async(req, res) =>{ 
 try {
     const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name', 'avatar']);
     res.json(profile);
     if(!profile) return res.status(400).json({msg: 'profile not found'})
 } catch (err) {
     console.error(err.message);
     if(err.kind == 'ObjectId'){
        return res.status(400).json({msg: 'profile not found'}) 
     }
     res.status(500).send('Server Error');
 }
});


// @route DELETE api/profile
// @desc  Delete profile, user & posts
// @acess Private
router.delete('/',
auth, 
async(req, res) =>{
 try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'user Removed'});
 } catch (err) {
     console.log(req.user)
    console.error(err.message);
    res.status(500).send('Server Error');
 }
});

// @route PUT api/profile/experience
// @desc  Add profile experience
// @acess Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'company is required').not().isEmpty(),
    check('from', 'From is required').not().isEmpty(),
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({ user: req.user.id})
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route DELETE api/profile/experience/:exp_id
// @desc  Delete experience from profile
// @acess Private
router.delete('/experience/:exp_id', auth, 
async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id})
        // get remove index

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    
})

// @route PUT api/profile/education
// @desc  Add profile education
// @acess Private
router.put('/education', [auth, [
    check('school', 'school is required').not().isEmpty(),
    check('degree', 'degree is required').not().isEmpty(),
    check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
    check('from', 'From is required').not().isEmpty(),
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        console.log('req>>', req.user)
        console.log('req>>', req.params)
        const profile = await Profile.findOne({ user: req.user.id});
        console.log('profile>>', profile);
        profile.eduction.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route DELETE api/profile/education/:edu_id
// @desc  Delete education from profile
// @acess Private
router.delete('/education/:edu_id', auth, 
async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id})
        // get remove index

        const removeIndex = profile.eduction.map(item => item.id).indexOf(req.params.edu_id);
        profile.eduction.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    
})  

// @route GET api/profile/github/:username
// @desc  Get user repos from Github
// @acess Public
router.get('/github/:username', (req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubsecret')}`,
            method: 'GET',
            headers: { 'user-agent' : 'node.js'}
        }
        request(options, (error, response, body) => {
            if(error) console.error(error);
            if(response.statusCode !== 200){
               return res.status(400).json({ msg: 'No Github Profile Found'})
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        res.status(500).send('Server Error')
    }
})
module.exports = router;