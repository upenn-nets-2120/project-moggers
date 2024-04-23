const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

var db = require('../models/database.js');

const router = express.Router();

// all functions for handling data, calling the database, post/get requests, etc.

router.post('/register', async (req, res) => {
    try {
        var { username, password, firstName, lastName, email, affiliation, birthday } = req.body;
        
        if (!username || !password || !firstName || !lastName || !email || !affiliation || !birthday) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }

        for (var i = 0; i < username.length; i++) {
            if (!/[A-Za-z0-9 \.\?,_]/.test(username[i])) {
                return res.status(400).send({error: 'Username contains invalid characters. Please try again.'});
            }
        }
        var existingUser = await db.send_sql(`SELECT * FROM users WHERE email = "${email}"`);
        if (existingUser.length > 0) {
            return res.status(409).json({error: "An account with this email already exists, please login."});
        }
        var existingUser = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
        if (existingUser.length > 0) {
            return res.status(409).json({error: "An account with this username already exists, please try again."});
        }
  
        bcrypt.genSalt(10, async (err, salt) => {
            if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
            }
            bcrypt.hash(password, salt, async (err, hashedPassword) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            await db.insert_items(`INSERT INTO users (username, password, firstName, lastName, email, affiliation, birthday, profilePhoto, hashtags) VALUES ("${username}", "${hashedPassword}", "${firstName}", "${lastName}", "${email}", "${affiliation}", "${birthday}", "${profilePhoto}", "${hashtags}")`);
            
            res.status(200).json({message: `{username: '${username}'}`});
            });
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

    
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
        const user = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
        if (user.length === 0) {
            return res.status(401).json({error: 'Username and/or password are invalid.'});
        }
        const user_id = user[0].user_id;
        const hashed_password = user[0].password;
        bcrypt.compare(password, hashed_password, (err, result) => {
            if (result) {
                req.session.user_id = user_id;
                req.session.username = username;
                res.status(200).json({username: username});
            } else {
                res.status(401).json({error: 'Username and/or password are invalid.'});
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    if (req.session.user_id) {
        req.session.user_id = null;
        req.session.username = null;
        res.status(200).json({message: "You were successfully logged out."});
    } else {
        res.status(400).json({error: "No user was logged in."});
    }
});


module.exports = router;
