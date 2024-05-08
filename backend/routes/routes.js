const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
require('dotenv').config();

var db = require('../models/create_tables.js');
const db1 = require('../models/db_access');
const connection = db1.get_db_connection();
// var db1 = require('../models/db_access');

const router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
var config = require('../config.json');
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: 'g01',
    brokers: config.bootstrapServers
});

const consumer = kafka.consumer({ 
    groupId: 'g01a', 
    bootstrapServers: config.bootstrapServers});
const producer = kafka.producer();

const consumer2 = kafka.consumer({ 
        groupId: 'g01b', 
        bootstrapServers: config.bootstrapServers});

var kafka_messages_federated_posts = [];
var kafka_message1 = [];
router.get('/getKafka', (req, res) => {
    res.send(JSON.stringify(kafka_messages_federated_posts));
});
const {  CompressionTypes, CompressionCodecs } = require('kafkajs')
const SnappyCodec = require('kafkajs-snappy');
const { LexRuntimeV2 } = require('aws-sdk');
 
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;



const { ChromaClient } = require("chromadb");

const { getEmbeddingsFromS3, findTopKMatches, initializeFaceModels, indexAllFaces } = require('./appChroma');
const client = require('/nets2120/project-moggers/backend/routes/chromaClient.js');
var path = require('path');

const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const axios = require('axios');


initializeFaceModels().then(async () => {

  const collection = await client.getOrCreateCollection({
    name: "face-api",
    embeddingFunction: null,
    // L2 here is squared L2, not Euclidean distance
    metadata: { "hnsw:space": "l2" },
  });

  console.info("Looking for files");
  const promises = [];
  // Loop through all the files in the images directory
  fs.readdir("images", function (err, files) {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }

    files.forEach(function (file, index) {
      console.info("Adding task for " + file + " to index.");
      promises.push(indexAllFaces(path.join("images", file), file, collection));
    });
    console.info("Done adding promises, waiting for completion.");
    Promise.all(promises)
    .then(async (results) => {
      console.info("All images indexed.");
  
    //   const search = 'query.jpg';
  
    //   console.log('\nTop-k indexed matches to ' + search + ':');
    //   for (var item of await findTopKMatches(collection, search, 5)) {
    //     for (var i = 0; i < item.ids[0].length; i++) {
    //       console.log(item.ids[0][i] + " (Euclidean distance = " + Math.sqrt(item.distances[0][i]) + ") in " + item.documents[0][i]);
    //     }
    //   }
    
    })
    .catch((err) => {
      console.error("Error indexing images:", err);
    });
    });

});


// get recommendations for people to follow
router.get('/recommendations', async (req, res) => {
    try {
         var id = req.query.user_id;
   

        if (!id) {
            return res.status(400).json({error: 'Missing id for get following'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find ID in users or found more than one.'});
        }

        var recommendations = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN recommendations r 
            ON u.id = r.recommendation
            WHERE r.person = "${id}"
            ORDER BY r.strength DESC`
        );

        // debug print
        console.log(recommendations);
        return res.status(200).json({ recommendations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/findMatches', async (req, res) => {
    try {
        
        const userSelfie = req.query.userSelfie;
        const userSelfieEmbeddings = await getEmbeddingsFromS3(userSelfie);
        const topMatches = await findTopKMatches(collection, userSelfieEmbeddings, 5);

        return res.status(200).json({ topMatches });
    } catch (error) {
        
        return res.status(500).json({ error: 'Internal server error' });
    }
});
  




// all functions for handling data, calling the database, post/get requests, etc.
router.get('/', (req, res) => {
    var user_id = 0;
    
    var username ="lmfao";
    console.log("kmmmmmm");
    if (typeof req.session !== 'undefined' && typeof req.session.user_id !== 'undefined') {
        console.log('x!');
        user_id = req.session.user_id;
        username = req.session.username;
    } else {
        console.log("Session or user_id is undefined, setting defaults.");
        user_id = -1;
        username = "default_username"; // You can set any default value for username here
    }

    return res.json({ "user_id" : user_id, "username": username });
});

router.get('/hi', (req, res) => {
    res.status(200).json({message: 'Hello World!'});
});

// POST /register
router.post('/register', async (req, res) => {
    try {
        var { username, password, firstName, lastName, email, affiliation, birthday, hashtags, profilePhoto } = req.body;
        
        if (!profilePhoto) {
            profilePhoto = "";
        }
        if (!hashtags) {
            hashtags = "";
        }
        
        if (!username || !password || !firstName || !lastName || !email || !affiliation || !birthday) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
       

        for (var i = 0; i < username.length; i++) {
            if (!/[A-Za-z0-9 \.\?,_]/.test(username[i])) {
                return res.status(400).send({error: 'Username contains invalid characters. Please try again.'});
            }
        }
        
        var existingUser = await db1.send_sql(`SELECT * FROM users WHERE email = "${email}"`);
      
        if (existingUser.length > 0) {
            return res.status(409).json({error: "An account with this email already exists, please login."});
        }

        var existingUser = await db1.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
    
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
            await db1.insert_items(`INSERT INTO users (username, password, firstName, lastName, email, affiliation, birthday, profilePhoto, hashtags) VALUES ("${username}", "${hashedPassword}", "${firstName}", "${lastName}", "${email}", "${affiliation}", "${birthday}", "${profilePhoto}", "${hashtags}")`);
            
            res.status(200).json({message: `{username: '${username}'}`})
            });
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/goOnline', async (req, res) => {
  
    try {
        console.log("did we entere");
        var username = req.body.username;

        if (!username) {
            console.log("did we entere1");
            return res.status(400).json({error: 'Missing username'});
        }
        console.log("did we entere2");
       
        var existingUser = await db1.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
      
        if (existingUser.length == 0) {
            return res.status(409).json({error: "Account does not exist"});
        }
        await db1.send_sql(`UPDATE users SET status = true WHERE username = "${username}"`);
        res.status(200).json({message: `updated status`});

        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/sendComment', async (req, res) => { // needs to be debugged
    try {
        const { post_id, parent_post, author, content } = req.body;

        const timestamp = new Date();

        const date_posted = new Date().toISOString().split('T')[0];
        const timestampString = timestamp.toISOString();
        
        if (parent_post == -1) {
            const query = `INSERT INTO comments (post_id, author, content, date_posted, timstamp) 
                       VALUES (${post_id},  ${author}, "${content}", "${date_posted}", "${timestampString}")`;
            await db1.insert_items(query);
            return res.status(200).json({ message: 'Comment sent successfully'});
        } else {
            const query = `INSERT INTO comments (post_id, parent_post, author, content, date_posted, timstamp) 
            VALUES (${post_id}, ${parent_post}, ${author}, "${content}", "${date_posted}", "${timestampString}")`;
            await db1.insert_items(query);
            return res.status(200).json({ message: 'Comment sent successfully'});
        }

    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/goOffline', async (req, res) => {
    try {
        var username = req.body.username;
        
        if (!username) {
            return res.status(400).json({error: 'Missing username'});
        }

        var existingUser = await db1.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
      
        if (existingUser.length == 0) {
            return res.status(409).json({error: "Account does not exist"});
        }
        await db1.send_sql(`UPDATE users SET status = false WHERE username = "${username}"`);
        res.status(200).json({message: `updated status`});
     
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addInterests', async (req, res) => {
    try {
        var name = req.body.name;
        // name VARCHAR(255),
        // count INT,
        // PRIMARY KEY (name)
        // var username = req.body.username;
      
        if (!name) {
            return res.status(400).json({error: 'Missing interest name'});
        }
           
        var existingInterest = await db1.send_sql(`SELECT * FROM interests WHERE name = "${name}"`);
      
        if (existingInterest.length == 0) {
            await db1.insert_items(`INSERT INTO interests (name, count) VALUES ("${name}", 1)`);
            res.status(200).json({message: `Added an interest`});
        } else {
            await db1.send_sql(`UPDATE interests SET count = count + 1 WHERE name = "${name}"`);
            res.status(200).json({message: `Updated an interest`});
        }
     
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addHashtag', async (req, res) => {
    try {
        var { name, user_id } = req.body;

        if (!name || !user_id) {
            return res.status(400).json({ error: 'Missing interest name or user_id' });
        }
    
        const existingHashtag = await db1.send_sql(`SELECT * FROM hashtags  WHERE name = "${name}"AND user_id = ${user_id};  `);
       
        if (existingHashtag.length != 0) {
            return res.status(400).json({ error: 'Hashtag already exists' });
        }
   
        await db1.insert_items(`INSERT INTO hashtags (name, user_id) VALUES ("${name}", ${user_id})`);
        res.status(200).json({ message: `Added a new hashtag` });

        } catch (error) {
    
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/sendFriendRequest', async (req, res) => {
    try {
        var {follower, followed} = req.body;
        
        if (!follower || ! followed) {
            return res.status(400).json({error: 'Missing friend request input'});
        }
        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${follower}"`)
        var count1res = count1[0]['COUNT(*)'];
        
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find follower ID in users or found more than one.'});
        }
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${followed}"`)
        var count2res = count2[0]['COUNT(*)'];
    
        if (count2res != 1) {
            return res.status(500).json({message: 'Could not find followed ID in users or found more than one.'});
        }
        var existingFriends = await db1.send_sql(` SELECT COUNT(*) AS count FROM friends WHERE follower = ${follower} AND followed = ${followed};  `);
        
        if (existingFriends[0].count != 0) {
            return res.status(500).json({message: `User is already followed`});
        }
        var existingFriendRequest = await db1.send_sql(` SELECT COUNT(*) AS count FROM friendRequests  WHERE follower = ${follower} AND followed = ${followed};  `);
        if (existingFriendRequest[0].count != 0) {
            return res.status(500).json({message: `Request Exists`});
        }
        await db1.insert_items(`INSERT INTO friendRequests (follower, followed) VALUES ("${follower}", "${followed}")`);
        await db1.send_sql(`DELETE FROM recommendations WHERE person = ${follower} AND recommendation = ${followed};`)
        return res.status(200).json({message: `Request sent`});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getFriendRequests', async (req, res) => {
    try {
        var id = req.query.id; 
        
        if (!id) {
            return res.status(400).json({error: 'Missing id for friend request'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find follower ID in users or found more than one.'});
        }
        var friendRequests = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN friendRequests f ON u.id = f.follower 
            WHERE f.followed = "${id}"
        `);
        // var followerIds = friendRequests.map(row => row.follower);
       return res.status(200).json({ friendRequests });    
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/acceptFriendRequest', async (req, res) => {
    try {
        var {follower, followed} = req.body;
        
        if (!follower || ! followed) {
            return res.status(400).json({error: 'Missing friend request input'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${follower}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find follower ID in users or found more than one.'});
        }
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${followed}"`)
        var count2res = count2[0]['COUNT(*)'];
    
        if (count2res != 1) {
            return res.status(500).json({message: 'Could not find followed ID in users or found more than one.'});
        }

        var existingFriendRequest = await db1.send_sql(` SELECT COUNT(*) AS count  FROM friendRequests  WHERE follower = ${follower} AND followed = ${followed};  `);
        if (existingFriendRequest[0].count == 0) {
            return res.status(500).json({message: `Friend request does not exist`});
        }
        var existingFriends = await db1.send_sql(` SELECT COUNT(*) AS count  FROM friends  WHERE follower = ${follower} AND followed = ${followed};  `);
        
        if (existingFriends[0].count != 0) {
            return res.status(500).json({message: `User is already followed`});
        }
        await db1.send_sql(`DELETE FROM friendRequests WHERE follower = ${follower} AND followed = ${followed};`);
        await db1.insert_items(`INSERT INTO friends (follower, followed) VALUES ("${follower}", "${followed}")`);
        return res.status(200).json({message: `Request accepted`});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getFollowers', async (req, res) => {
    try {
        var id = req.query.user_id;
        
        if (!id) {
            return res.status(400).json({error: 'Missing id for get followers'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find ID in users or found more than one.'});
        }
        var followers = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN friends f ON u.id = f.follower 
            WHERE f.followed = "${id}"
        `);
        // var followerIds = followers.map(row => row.follower);
        return res.status(200).json({ followers });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getFollowing', async (req, res) => {
    try {
        var id = req.query.user_id;
        
        if (!id) {
            return res.status(400).json({error: 'Missing id for get following'});
        }
        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find ID in users or found more than one.'});
        }
        var following = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN friends f ON u.id = f.followed 
            WHERE f.follower = "${id}"
        `);
        // var followingIds = following.map(row => row.followed);
       return res.status(200).json({ following});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// get recommendations for people to follow
router.get('/recommendations', async (req, res) => {
    try {
        var id = req.query.user_id;
        // var id = 3;

        if (!id) {
            return res.status(400).json({error: 'Missing id for get following'});
        }
        console.log("id: ", id );

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find ID in users or found more than one.'});
        }
            
        var recommendations = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN recommendations r 
            ON u.id = r.recommendation
            WHERE r.person = "${id}"
            ORDER BY r.strength DESC
        `);
        
        // debug print
        console.log(recommendations);
        return res.status(200).json({ recommendations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getTopTenHashtags', async (req, res) => {
    try {
        var topTen = await db1.send_sql(`SELECT name, COUNT(*) AS frequency
        FROM hashtagPosts
        GROUP BY name
        ORDER BY frequency DESC
        LIMIT 10`);
        var resTop = topTen.map(row => row.name);
        return res.status(200).json({ topTen: resTop });     
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getFeed', async (req, res) => {
    
    try {
        // const curr_id = req.session.user_id
        // const curr_id = 3;
        var curr_id = req.query.userId;

        if (curr_id == null) 
            return res.status(403).json({error: 'Not logged in.'}
        );
        
        if (!curr_id) {
            return res.status(400).json({error: 'Missing id for get following'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${curr_id}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find ID in users or found more than one.'});
        }

        var following = await db1.send_sql(`SELECT followed FROM friends WHERE follower = "${curr_id}"`);
        const followedUserIds = following.map(entry => entry.followed);
        followedUserIds.push(curr_id);
        const feed = await db1.send_sql(`
            SELECT posts.id, posts.content, posts.image, posts.timstamp, users.username, users.firstName, users.lastName, users.profilePhoto, (
                SELECT COUNT(*) 
                FROM likes 
                WHERE post_id = posts.id
            ) AS like_count
            FROM posts 
            JOIN users ON posts.author = users.id
            WHERE posts.author IN (${followedUserIds.join(', ')})
        `);
    
        return res.status(200).json({results: feed});

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
        const user = await db1.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
        console.log(user);
        if (user.length === 0) {
            return res.status(401).json({error: 'Username and/or password are invalid.'});
        }
 
        const user_id = user[0].id;
        const hashed_password = user[0].password;
        bcrypt.compare(password, hashed_password, (err, result) => {
            if (result) {
               
                req.session.user_id = user_id;
                req.session.username = username;
                return res.status(200).json({user_id: user_id, username: username});
            } else {
                return res.status(401).json({error: 'Username and/or password are invalid.'});
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
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

router.post('/createPost', async (req, res) => {
    try {
        var { author, content, image_url} = req.body;
        
        if (!author || !content || !image_url) {
            return res.status(400).json({error: 'Create post missing arguments'});
        }
        const timstamp = new Date().toISOString();

        var validAuthor = await db1.send_sql(` SELECT COUNT(*) AS count FROM users WHERE id = ${author} `);
        const words = content.split(' ').map(word => word.trim());

        const filteredHashtags = words.filter(word => word.startsWith('#') && word.length > 1).map(word => word.slice(1));

        const hashtags = filteredHashtags;
     
        if (validAuthor[0].count == 0) {
            return res.status(500).json({message: `User does not exists`});
        }
        await db1.insert_items(`INSERT INTO posts (author, content, image, num_likes, timstamp) VALUES ("${author}", "${content}", "${image_url}", 0, "${timstamp}")`);
        const x = await db1.send_sql('SELECT LAST_INSERT_ID() AS id');
        for (const hashtag of hashtags) {
            await db1.insert_items(`INSERT INTO hashtagPosts (name, hashID) VALUES ("${hashtag}", ${x[0].id})`);
         
        }
        const username1 = await db1.send_sql(` SELECT username FROM users WHERE id = ${author} `);
    
        const x1 = username1[0].username;
   
        await producer.connect();
        const post = {
            username: x1,
            source_site: 'g01',
            post_uuid_within_site: x[0].id,
            post_text: content,
            content_type: 'text/plain'
        };
        const message = {
            value: JSON.stringify(post)
        };
        await producer.send({
            topic: 'FederatedPosts',
            messages: [message]
        });

        return res.status(200).json({message: "Post made"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    };
});

router.post('/addLike', async (req, res) => {
    try {
        var { post_id, user_id} = req.body;
        if (!post_id || !user_id) {
            return res.status(400).json({error: 'Create post missing arguments'});
        }

        var validAuthor = await db1.send_sql(` SELECT COUNT(*) AS count  FROM users  WHERE id = ${user_id} `);
        
        if (validAuthor[0].count == 0) {
            return res.status(500).json({message: `User does not exists`});
        }

        var validPost = await db1.send_sql(` SELECT COUNT(*) AS count  FROM posts  WHERE id = ${post_id} `);
        
        if (validPost[0].count == 0) {
            return res.status(500).json({message: `Post does not exists`});
        }
        var existingLike = await db1.send_sql(`SELECT COUNT(*) AS count FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);

        if (existingLike[0].count > 0) {
            return res.status(500).json({ message: `Like already exists` });
        }

        await db1.send_sql(`UPDATE posts SET num_likes = num_likes + 1 WHERE id = ${post_id}`);

        await db1.insert_items(`INSERT INTO likes (post_id, user_id) VALUES ("${post_id}", "${user_id}")`);

        res.status(200).json({message: "Post liked"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Internal server error'});
    };
});

router.post('/removeLike', async (req, res) => {
    try {
        var { post_id, user_id } = req.body;
        if (!post_id || !user_id) {
            return res.status(400).json({ error: 'Remove like missing arguments' });
        }

        var validAuthor = await db1.send_sql(`SELECT COUNT(*) AS count FROM users WHERE id = ${user_id}`);
        if (validAuthor[0].count == 0) {
            return res.status(500).json({ message: `User does not exist` });
        }
        
        var validPost = await db1.send_sql(`SELECT COUNT(*) AS count FROM posts WHERE id = ${post_id}`);
        if (validPost[0].count == 0) {
            return res.status(500).json({ message: `Post does not exist` });
        }

        var existingLike = await db1.send_sql(`SELECT COUNT(*) AS count FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);
        if (existingLike[0].count == 0) {
            return res.status(500).json({ message: `Like does not exist` });
        }

        await db1.send_sql(`UPDATE posts SET num_likes = num_likes - 1 WHERE id = ${post_id}`);

        await db1.send_sql(`DELETE FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);

        res.status(200).json({ message: "Like removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.post('/checkLikes', async (req, res) => {
    try {
        const { postIds, userId } = req.body;
    
        if (!postIds || !userId) {
            return res.status(400).json({ error: 'Missing postIds or userId' });
        }
    
        const likes = {};
    
        for (const postId of postIds) {
            const existingLike = await db1.send_sql(`SELECT COUNT(*) AS count FROM likes WHERE post_id = ${postId} AND user_id = ${userId}`);
            likes[postId] = existingLike[0].count > 0;
        }
    
        return res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});  

router.get('/numLikes', async (req, res) => {
    try {
        var post_id = req.body.post_id;
        if (!post_id) {
            return res.status(400).json({ error: 'Missing post_id' });
        }
        
        var validPost = await db1.send_sql(`SELECT COUNT(*) AS count FROM posts WHERE id = ${post_id}`);
        if (validPost[0].count == 0) {
            return res.status(500).json({ message: `Post does not exist` });
        }

        var numberLikes = await db1.send_sql(`SELECT COUNT(*) AS count FROM likes WHERE post_id = ${post_id}`);
     
        return res.status(200).json({numberLikes: numberLikes});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.post('/joinChat', async (req, res) => {
    try {
        const room = req.body.room;

        // write to database
        return res.send({
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.post('/leaveChat', async (req, res) => {
    try {
        const room = req.body.room;

        // write to database
        return res.send({
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});
// *********************************************************
// only call this method AFTER person 2 ACCEPTS the invite and also we sent the invite.
router.post('/postChats', async (req, res) => {
    try {
        var { chatName, user1, user2 } = req.body;
        if (!chatName || !user1 || !user2) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
        // Now check if both users are online
        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${user1}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find user1 ID in users or found more than one.'});
        }
        var status1 = await db1.send_sql(`SELECT status FROM users WHERE id = "${user1}"`);
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${user2}"`)
        var count2res = count2[0]['COUNT(*)'];
        if (count2res != 1) {
           
            return res.status(500).json({message: 'Could not find user2 ID in users or found more than one.'});
        }

        var status2 = await db1.send_sql(`SELECT status FROM users WHERE id = "${user2}"`);
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
        var x1 = await db1.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user1}"`);
        var x2 = await db1.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user2}"`);
       
        const x1parsed = x1.map(row => ({
            chat_id: row.chat_id, 
            user_id: row.user_id
        }));
        const x2parsed = x2.map(row => ({
            chat_id: row.chat_id, 
            user_id: row.user_id
        }));
        const combined = x1parsed.concat(x2parsed);
        const chatIdsSet = new Set();
        let hasDuplicates = false;

        for (const item of combined) {
            if (chatIdsSet.has(item.chat_id)) {
                hasDuplicates = true;
                break;
        } else {
            chatIdsSet.add(item.chat_id);
            }
        }

        if (hasDuplicates) {
            return res.status(500).json({message: 'A chat already exists with only these two users.'});
        }

        // Otherwise let us insert into the DBs
        await db1.insert_items(`INSERT INTO chats (name) VALUES ("${chatName}")`);
        const dbSize = await db1.send_sql('SELECT COUNT(*) FROM user_chats');
        var new_chat_id = 0;
        if (dbSize == 1) {
            // first insert
            new_chat_id = 1;
        } else {
            const max_chat_id = await db1.send_sql(`SELECT MAX(chat_id) FROM user_chats`);
     
            new_chat_id = max_chat_id[0]['MAX(chat_id)'] + 1;
        }
 
        await db1.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES (${user1}, ${new_chat_id})`);
        await db1.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES (${user2}, ${new_chat_id})`);
        var content = 'Chat created.';
        const timestamp = new Date().toISOString(); 
        await db1.insert_items(`INSERT INTO messages (author, content, chat_id, timstamp) VALUES ("${9}", "${content}", "${new_chat_id}", "${timestamp}")`);
        
        res.status(200).json({message: "Chat made."});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Internal server error'});
    };
});

router.post('/getConvos', async (req, res) => {
    try {
   
        
        const user1 = req.body.user_id;
      
        if (!user1) {
         
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }

        
        
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users`);
      
        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = ${user1}`);
        
        var count1res = count1[0]['COUNT(*)'];
       
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find user1 ID in users or found more than one.'});
        }
     
        var data = await db1.send_sql(`
        SELECT uc.chat_id AS chat_id, 
               c.name AS chat_name, 
               MAX(m.timstamp) AS latest_timestamp
        FROM user_chats uc
        JOIN chats c ON uc.chat_id = c.id
        JOIN messages m ON uc.chat_id = m.chat_id
        WHERE uc.user_id = "${user1}"
        GROUP BY uc.chat_id, c.name
        ORDER BY m.timstamp DESC
        `);
    
        
        return res.status(200).json({data});
 
    } catch (error) {
       
        res.status(500).json({ message: 'Internal server error' });
    };
});


router.get('/getMessages', async (req, res) => {
    try {
     
        const chatid = req.query.chatId;

        if (!chatid) {
        
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
      
      
        var data = await db1.send_sql(`
        SELECT messages.id AS message_id, messages.author AS author, messages.timstamp AS timestamp, messages.chat_id AS chat_id, messages.content AS content, chats.name AS chat_name
        FROM messages
        JOIN chats ON messages.chat_id = chats.id 
        WHERE chats.id = "${chatid}"
        ORDER BY messages.timstamp ASC;
        `);
        return res.status(200).json({data});
 
    } catch (error) {
        
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.get('/getComments', async (req, res) => {
    try {
        const postid = req.query.postId;

        if (!postid) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }

        // var data = await db1.send_sql(
        // SELECT comments.id AS comment_id, comments.author AS author, comments.timstamp AS timestamp, comments.content AS content 
        // FROM comments
        // WHERE comments.post_id = "${postid}" AND comments.parent_post IS NULL
        // );
        var data = await db1.send_sql(`
            SELECT comments.id AS comment_id, 
                   comments.author AS author_id, 
                   users.username AS author_username, 
                   users.profilePhoto AS author_profile_photo,
                   comments.timstamp AS timestamp, 
                   comments.content AS content 
            FROM comments
            JOIN users ON comments.author = users.id
            WHERE comments.post_id = "${postid}" AND comments.parent_post IS NULL`
        );
        return res.status(200).json({data});
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.get('/getCommentThreads', async (req, res) => {
    try {
        const postcommentid = req.query.postCommentId;

        if (!postcommentid) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
         
        var data = await db1.send_sql(`
            SELECT comments.id AS comment_id, 
                   comments.author AS author_id, 
                   comments.parent_post AS parent_post,
                   users.username AS author_username, 
                   users.profilePhoto AS author_profile_photo,
                   comments.timstamp AS timestamp, 
                   comments.content AS content 
            FROM comments
            JOIN users ON comments.author = users.id
            WHERE comments.parent_post = "${postcommentid}"`
        );
        return res.status(200).json({data});
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.post('/postMessage', async (req, res) => {
    try {
        var author = req.body.author;
        var content = req.body.content;
        var chat_id = req.body.chat_id;
        if (!author || !content || !chat_id) {
            return res.status(400).json({ error: 'Missing required arguments' });
        }
        
        const timestamp = new Date().toISOString(); 

        await db1.insert_items(`INSERT INTO messages (author, content, chat_id, timstamp) VALUES ("${author}", "${content}", "${chat_id}", "${timestamp}")`);

        return res.status(200).json({ message: "Message posted successfully" });
    } catch (error) {
        // Handle errors
     
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/declineChatInvite', async (req, res) => {
    try {
  
        var sender = req.body.senderId;
        var receiver = req.body.receiverId;
       
        if (!sender || !receiver) {
            return res.status(400).json({ error: 'Missing required arguments' });
        }
       
        await db1.send_sql(`DELETE FROM chatRequests WHERE sender = ${sender} AND receiver = ${receiver};`);

        return res.status(200).json({ message: "Declined chat invite" });
    } catch (error) {
       
     
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/getInvites', async (req, res) => {
    try {
        const id = req.query.userId;

        if (!id) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }
         
        var data = await db1.send_sql(`
        SELECT * FROM chatRequests WHERE receiver = "${id}" 
        `);
        return res.status(200).json({data});
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

const credentials = fromIni({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AUTH_TOKEN,
});

// Initialize the S3 client with your region
const s3Client = new S3Client({region: config.awsRegion, credentials: credentials });
// gets an S3 presigned URL for uploading a file
router.post("/get_presigned_url", async (req, res) => {
    try {
        const fileName = req.body.fileName;
        const fileType = req.body.fileType;
       
        const uniqueFileName = `${uuidv4()}_${fileName}`;
        const params = {
            Bucket: config.s3BucketName,
            Key: uniqueFileName,
            ContentType: fileType,
        };

        const command = new PutObjectCommand(params);
        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
        });

        res.json({ url: presignedUrl, fileName: uniqueFileName });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({ error: "Error generating presigned URL" });
    }
});

router.get('/getProfile', async (req, res) => {
    try {
        const userid = req.query.user_id;
       
        if (!userid) {
            return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
        }

        var data = await db1.send_sql(`
            SELECT username, firstName, lastName, affiliation, profilePhoto, hashtags, birthday, interests
            FROM users
            WHERE users.id = "${userid}" 
        `);
        var posts = await db1.send_sql(`
            SELECT id, content, image, num_likes, timstamp
            FROM posts
            WHERE posts.author = "${userid}" 
        `);
        const followers = await db1.send_sql(`SELECT COUNT(*) FROM friends WHERE followed = "${userid}"`);
        const following = await db1.send_sql(`SELECT COUNT(*) FROM friends WHERE follower = "${userid}"`);
        const y1 = followers[0]['COUNT(*)'];
        const y2 = following[0]['COUNT(*)'];
        var status1 = await db1.send_sql(`SELECT status FROM users WHERE id = "${userid}"`);

        const data1 = [{
            "username": data[0].username,
            "firstName": data[0].firstName,
            "lastName": data[0].lastName,
            "affiliation": data[0].affiliation,
            "profilePhoto": data[0].profilePhoto,
            "birthday": data[0].birthday,
            "interests": data[0].interests,
            "followers": y1,
            "following": y2,
            "status": status1[0].status
        }];
       
        return res.status(200).json({ data1, posts });
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});


router.get('/getUserName', async (req, res) => {
    console.log("99");
    try {
        const username = req.query.username;
        console.log(username);
        if (!username) {
            return res.status(400).json({error: 'Missing username.'});
        }
      
        var data1 = await db1.send_sql(`
        SELECT users.id 
        FROM users 
        WHERE users.username = "${username}"
        `);
        var data;
        
        if (data1.length === 0) {
            return res.status(200).json({ data: { id: -1 } });
        } else {
             data = data1[0];
            return res.status(200).json({ data });
        }
       
    } catch (error) {
       
        return res.status(500).json({ message: 'Internal server error' });
    };
});


router.get('/getIdGivenUsername', async (req, res) => {
    try {
        const id = req.query.user_id;
        console.log(id);

        if (!id) {
            return res.status(400).json({error: 'Missing id.'});
        }
      
        var data1 = await db1.send_sql(`
        SELECT users.username
        FROM users 
        WHERE users.id = "${id}"
        `);
        var data;
        
        if (data1.length === 0) {
            return res.status(200).json({ data: { username: 'fail' } });
        } else {
             data = data1[0];
            return res.status(200).json({ data });
        }
       
    } catch (error) {
       
        res.status(500).json({ message: 'Internal server error' });
    };
});
router.get('/getStatus', async (req, res) => {
    try {
       
        const userid = req.query.user_id;
      

        if (!userid) {
            return res.status(400).json({error: 'Missing username.'});
        }
      
        var data = await db1.send_sql(`SELECT status FROM users WHERE id = "${userid}"`);
     
        return res.status(200).json({ data});
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

router.get('/chatAlreadyExists', async (req, res) => {
    try {
        const user1 = req.query.user_id1;
      
        const user2 = req.query.user_id2;

        if (!user1 || !user2) {
            return res.status(400).json({error: 'Missing id.'});
        }
      
        var x1 = await db1.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user1}"`);
        var x2 = await db1.send_sql(`SELECT * FROM user_chats WHERE user_id = "${user2}"`);
       
        const x1parsed = x1.map(row => ({
            chat_id: row.chat_id, 
            user_id: row.user_id
        }));
        const x2parsed = x2.map(row => ({
            chat_id: row.chat_id, 
            user_id: row.user_id
        }));
        const combined = x1parsed.concat(x2parsed);
        const chatIdsSet = new Set();
        let hasDuplicates = false;

        for (const item of combined) {
            if (chatIdsSet.has(item.chat_id)) {
                hasDuplicates = true;
                break;
        } else {
            chatIdsSet.add(item.chat_id);
            }
        }

        if (hasDuplicates) {
            return res.status(200).json({ status: true});
        }
        return res.status(200).json({ status: false});
   
       
    
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    };
});


router.get('/alreadySent', async (req, res) => {
    try {
        const userid1 = req.query.user_id1;
        const userid2 = req.query.user_id2;

        if (!userid1 || !userid2) {
            return res.status(400).json({error: 'Missing id.'});
        }
      
        var status1 = await db1.send_sql(`
        SELECT *
        FROM chatRequests
        WHERE sender = "${userid1}" OR receiver = "${userid2}"
        `);
       
     
        if (status1.length === 0) {
            return res.status(200).json({ status: false});
        } else {
            return res.status(200).json({ status: true});
        }
       
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    };
});

router.post('/sendChatRequest', async (req, res) => {
    try {
        var {sender, receiver} = req.body;
        
        if (!sender || ! receiver) {
            return res.status(400).json({error: 'Missing chat request input'});
        }
        console.log("hi1");

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${sender}"`)
        var count1res = count1[0]['COUNT(*)'];
        console.log("hi2");
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find sender ID in users or found more than one.'});
        }
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${receiver}"`)
        var count2res = count2[0]['COUNT(*)'];
    
        if (count2res != 1) {
            return res.status(500).json({message: 'Could not find receiver ID in users or found more than one.'});
        }
           
        console.log("hi3");
    
        var existingRequest = await db1.send_sql(` SELECT COUNT(*) AS count FROM chatRequests  WHERE sender = ${sender} AND receiver = ${receiver};  `);
        
        if (existingRequest[0].count != 0) {
            return res.status(500).json({message: `Chat request is already sent`});
        }
        console.log("hi4");


        var existingRequest2 = await db1.send_sql(` SELECT COUNT(*) AS count FROM chatRequests  WHERE sender = ${receiver} AND receiver = ${sender};  `);
        console.log(existingRequest2);
        
        if (existingRequest2[0].count != 0) {
            return res.status(200).json({message: `Your friend already sent you a request, please accept.`});///////////////////
        }




        // var existingChatRequest = await db1.send_sql(` SELECT COUNT(*) AS count FROM chatRequests  WHERE sender = ${follower} AND followed = ${followed};  `);
        // if (existingChatRequest[0].count != 0) {
        //     return res.status(500).json({message: `Request Exist`});
        // }
        await db1.insert_items(`INSERT INTO chatRequests (sender, receiver) VALUES ("${sender}", "${receiver}")`);
        return res.status(200).json({message: `Request sent`});
        
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getChatRequests', async (req, res) => {
    try {
        var id = req.query.id; 
        
        if (!id) {
            return res.status(400).json({error: 'Missing id for friend request'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${id}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(500).json({message: 'Could not find user ID in users or found more than one.'});
        }
        var chatRequests = await db1.send_sql(`
            SELECT u.id, u.username, u.firstName, u.lastName, u.profilePhoto
            FROM users u 
            JOIN chatRequests f ON u.id = f.sender 
            WHERE f.receiver = "${id}"
        `);

        // var followerIds = friendRequests.map(row => row.follower);
       return res.status(200).json({ chatRequests });    
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/acceptChatRequest', async (req, res) => {
    try {
        var {sender, receiver} = req.body;
        
        if (!sender || ! receiver) {
            return res.status(400).json({error: 'Missing chat request input'});
        }

        var count1 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${sender}"`)
        var count1res = count1[0]['COUNT(*)'];
    
        if (count1res != 1) {
            return res.status(400).json({message: 'Could not find user ID in users or found more than one.'});
        }
        var count2 = await db1.send_sql(`SELECT COUNT(*) FROM users WHERE id = "${sender}"`)
        var count2res = count2[0]['COUNT(*)'];
    
        if (count2res != 1) {
            return res.status(400).json({message: 'Could not find user ID in users or found more than one.'});
        }

        var existingChatRequest = await db1.send_sql(` SELECT COUNT(*) AS count  FROM chatRequests  WHERE sender = ${sender} AND receiver = ${receiver};  `);
        if (existingChatRequest[0].count == 0) {
            return res.status(400).json({message: `Friend request does not exist`});
        }
        // var existingFriends = await db1.send_sql(` SELECT COUNT(*) AS count  FROM chatRequests  WHERE sender = ${sender} AND receiver = ${receiver};  `);
        
        // if (existingFriends[0].count != 0) {
        //     return res.status(500).json({message: `User is already followed`});
        // }
        await db1.send_sql(`DELETE FROM chatRequests WHERE sender = ${sender} AND receiver = ${receiver};`);
        
        await db1.insert_items(`INSERT INTO chats (name) VALUES ("${sender}/${receiver} Chat")`);
        const x = await db1.send_sql('SELECT LAST_INSERT_ID() AS id');
        const new_chat_id = x[0].id;//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        await db1.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES ("${sender}", "${new_chat_id}")`);
        await db1.insert_items(`INSERT INTO user_chats (user_id, chat_id) VALUES ("${receiver}", "${new_chat_id}")`);
        var content = 'Chat created.';
        const timestamp = new Date().toISOString(); 
        await db1.insert_items(`INSERT INTO messages (author, content, chat_id, timstamp) VALUES ("${9}", "${content}", "${new_chat_id}", "${timestamp}")`);
        return res.status(200).json({message: `Request accepted`});
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


const run = async () => {
    // Consuming
    
    console.log(`Following topic FederatedPosts`);
    // await  consumer.connect();
    
    // await consumer.subscribe({ topic: 'FederatedPosts', fromBeginning: true });

    // await consumer.run({
    //     eachMessage: async ({ topic, partition, message }) => {
    //         kafka_messages_federated_posts.push({
    //             value: message.value.toString(),
    //         });
    //         console.log({
    //             value: message.value.toString(),
    //         });
    //     },
    // });
};

const run2 = async () => {
    // Consuming
   
    console.log(`Following topic Twitter-Kafka`);
    // await consumer2.connect();

    // await consumer2.subscribe({ topic: 'Twitter-Kafka', fromBeginning: true });

    // await consumer2.run({
    //     eachMessage: async ({ topic, partition, message }) => {
    //         kafka_message1.push({
    //             value: message.value.toString(),
    //         });
    //         console.log({
    //             value: message.value.toString(),
    //         });
    //     },
    // });
};


run().catch(console.error);
run2().catch(console.error);

module.exports = router;