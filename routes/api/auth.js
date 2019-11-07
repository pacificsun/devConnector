const express  = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

const auth = require('../../middleware/auth');
const User = require('../../models/User')

// @route GET api/auth
// @desc  Test route
// @acess Public 
//first path hunxa second call back hunxa
router.get('/', 
auth, 
async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user)
    } catch(err){
        console.error(err.message);
        res.status(500).send('server error')
    }
});

// @route POST api/auth
// @desc  Authenticate user & get token
// @acess Public (we dont need token)

router.post('/',[
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required ').exists()
],
async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
     return res.status(400).json({errors: errors.array()}  )
    }
    const { email, password } = req.body;

    try { 
        // See if user exists
        let user = await User.findOne({email});
        if(!user){
           return res.status(400).json({error: [{msg: 'Invalid credentials'}]})
        } 
        const isMatch = await bcrypt.compare(password, user.password); 
        if(!isMatch){
            return res.status(400).json({errors: [{msg: 'Invalid credentials'}]})
        }
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'), 
            {expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
            )

        
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('server error'); 
    }
   
});


module.exports = router;