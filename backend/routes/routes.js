const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

var db = require('../models/database.js');

const router = express.Router();

// all functions for handling data, calling the database, post/get requests, etc.

// POST /register
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

// POST /login
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


// *********************************************************
// only call this method AFTER person 2 ACCEPTS the invite and also we sent the invite.
var postChats = async function(req, res) {
    try {
        var { chatName, user1, user2 } = req.body;
        if (!chatName || !user1, !user2) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }

        // Now check if both users are online
        var count1 = await db.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${user1}"`)
        if (count1 != 1) {
            return res.status(500).json({message: 'Could not find user1 ID in users or found more than one.'});
        }
        var status1 = await db.send_sql(`SELECT status FROM users WHERE id = "${user1}"`);
        var count2 = await db.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${user2}"`)
        if (count2 != 1) {
            return res.status(500).json({message: 'Could not find user2 ID in users or found more than one.'});
        }
        var status2 = await db.send_sql(`SELECT status FROM users WHERE id = "${user2}"`);
        if (!status1 || !status2) {
            return res.status(500).json({message: 'One or both users are not online, cannot make chat.'});
        }


        var already_exists = false;
        //////////////////////////////////////////////////////////////////////////////////
        // Now check if a chat with these two already exists
        // one that is flipped (user, id )
        // duplicate it, two filers, one for the first user one for the second user 
        // merge them back, flip them back join on id 
        // iterate through id, if any of them have lenght 2, return yes
        // TODO: update already_exists
        var x1 = await db.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user1}"`);
        var x2 = await db.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user2}"`);




        //////////////////////////////////////////////////////////////////////////////////


        
        if (already_exists) {
            return res.status(500).json({message: 'A chat already exists with only these two users.'});
        }

        

        // Otherwise let us insert into the DBs
        await db.insert_items(`INSERT INTO chats (name) VALUES ("${chatName}")`);
        const dbSize = await db.send_sql('SELECT COUNT(*) FROM user_chats');
        var new_chat_id;
        if (dbSize == 0) {
            // first insert
            new_chat_id = 1;
        } else {
            const max_chat_id = await db.send_sql(`SELECT MAX(chat_id) FROM user_chats`);
            new_chat_id = max_chat_id + 1;
        }
        await db.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES (${user1}, ${new_chat_id})`);
        await db.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES (${user2}, ${new_chat_id})`);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Internal server error'});
    };
};
module.exports = router;
