const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { formatDocumentsAsString } = require("langchain/util/document");
const {
    RunnableSequence,
    RunnablePassthrough,
  } = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { read, rmdir } = require("fs");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

var vectorStore = null;

var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}



var getVectorStore = async function(req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "imdb_reviews2",
            url: "http://localhost:8000", // Optional, will default to this value
            });
    }
    return vectorStore;
}


// POST /register 
var postRegister = async function(req, res) {
//     Error handling:
// Return status 400 with JSON {error: 'One or more of the fields you entered was empty, please try again.'} for invalid query parameters. These include when:
// username is not provided.
// password is not provided.
// linked_id is not provided.
// Return status 409 (Conflict) with JSON {error: "An account with this username already exists, please try again."} when the username already exists in the database.
// Return status 500 with JSON {error: 'Error querying database.'} for any database query errors.
    if (!req.body.username || !req.body.password || !req.body.linked_id) 
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    
    try {
        const u = await db.send_sql(`SELECT * FROM users WHERE username = '${req.body.username}'`);
        if (u.length != 0) 
            return res.status(409).json({error: "An account with this username already exists, please try again."});
    
    } catch (err) {
        res.status(500).json({error: 'Error querying database.'});
    }
   
    helper.encryptPassword(req.body.password, function(err, x) {
        try {
            db.insert_items(`INSERT INTO users (username, hashed_password, linked_nconst) VALUES ('${req.body.username}', '${x}', '${req.body.linked_id}')`);
            return res.status(200).json({username: req.body.username});
        }
        catch (err) {
            return res.status(500).json({error: 'Error querying database.'});
        }
    });


};


// POST /login
var postLogin = async function(req, res) {
    // /login accepts POST requests with the following body parameters:

    // username
    // password
    // Use bcrypt to compare the password given in the login attempt with the hash stored in the users table for the user with the given username. When the login attempt is successful, return a status 200 with the following example response structure: {username: 'rpeng'}.
    
    // Error handling:
    
    // Return status 400 with JSON {error: 'One or more of the fields you entered was empty, please try again.} for invalid query parameters. These include when:
    // username is not provided.
    // password is not provided.
    // Return status 500 with JSON {error: 'Error querying database'} for any database query errors.
    // Return status 401 (Unauthorized) with JSON {error: Username and/or password are invalid.'}.
    // Session management:
    
    // If the login attempt is successful, we would like to store the current logged in user's information in the browser's session object.
    // When a user is logged in, store the user_id of that user in the session object using req.session.user_id
     if (!req.body.username || !req.body.password) 
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    // if (!helper.isOK(req.body.username) || !helper.isOK(req.body.title))
    // return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    
    try {
        const u = await db.send_sql(`SELECT * FROM users WHERE username = '${req.body.username}'`);
        if (u.length == 0) 
            return res.status(401).json({error: 'Username and/or password are invalid.'});
        const user = u[0]
        const pw = user['hashed_password'];
        const id = user['user_id']
        const us = req.body.username
        bcrypt.compare(req.body.password, pw, function(err, result) {
                if (result) {
                    req.session.user_id = id;
                    req.session.username = us;
                    return res.status(200).json({username: us});
                } else {
                    return res.status(401).json({error: 'Username and/or password are invalid.'});
                }
            });
    } catch (err) {
        return res.status(500).json({error: 'Error querying database.'});
    }
    
    
   

};


// GET /logout
var postLogout = function(req, res) {
    // /logout accepts GET requests and removes the current user from the req.session object (set req.session.user to null).

    // After successfully logging the user out, return a status 200 with {message: "You were successfully logged out."} in the response

    req.session.user_id = null; // wtf
    return res.status(200).json({message: "You were successfully logged out."});
};


// GET /friends

var getFriends = async function(req, res) {
    
    const x = req.session.user_id;
    if (x == null) 
        return res.status(403).json({error: 'Not logged in.'});
 

    try {
        const res1 = await db.send_sql(`
                SELECT names.nconst AS followed, names.primaryName FROM users JOIN friends ON users.linked_nconst = friends.follower JOIN names ON friends.followed = names.nconst WHERE users.user_id = ${x}`);
         console.log(res1);
         return res.status(200).json({results: res1});
    } catch (error) {
         return res.status(500).json({error: 'Error querying database.'});
    }

}


// GET /recommendations
var getFriendRecs = async function(req, res) {
    if (req.session.user_id == null) 
        return res.status(403).json({error: 'Not logged in.'});
    
    try {
        const rec = null;
        return res.status(200).json({results: rec});
    } catch (error) {

        return res.status(500).json({error: 'Error querying database.'});
    }
    
    // TODO: get all friend recommendations of current user

}


// POST /createPost
var createPost = async function(req, res)
 { // TODO: add to posts table
    /*
    /:username/createPost accepts POST requests with the following body parameters:

title
contentgi
parent_id
Only allow this route if a user is logged in. The ID of the current session user should be the author_id. Screen the title and content to only be alphanumeric characters, spaces, periods, question marks, commas, and underscores (e.g., no quotes, semicolons, etc.) to protect against SQL injection.

Upon successful post creation, return a status 201 with the response {message: "Post created."}.

Error handling:
Return status 403 (Forbidden) with JSON {error: 'Not logged in.'} if there is no user logged in.
Return status 400 with JSON {error: 'One or more of the fields you entered was empty, please try again.'} if any of the provided body params are empty.
Return status 500 with JSON {error: 'Error querying database.'} for any database query errors.
    */
    const user_id = req.session.user_id
    const parent_id = "null"
    const content = req.body.content;
    const title = req.body.title;
    if (user_id == null) 
        return res.status(403).json({error: 'Not logged in.'});
    if ( !content || !title) 
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    if (!helper.isOK(title))
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    if (!helper.isOK(content))
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});

    


    try {
        const res1 = await db.insert_items(`INSERT INTO posts (title, content, author_id, parent_post) 
        VALUES ('${title}', '${content}', ${user_id}, ${parent_id})`);
        if (res1 > 0)
            return res.status(201).send({message: 'Post created.'});
        return res.status(500).json({error: 'Error querying database.'});

    } catch(err) {
       return res.status(500).json({error: 'Error querying database.'});

    }

}

// GET /feed
var getFeed = async function(req, res) {
//     /:username/feed accepts GET requests

// Write a query that returns an array of posts that should be in the current session user's feed. For each post, SELECT the post id, author's username, parent post id, title, and content
// When getting the feed is successful, return a status 200 with a result that looks like this:
// const response = {
//   results: [
//     {
//       username: 
//       parent_post: 
//       title: 
//       content:
//     },
//     {
//       username: 
//       parent_post: 
//       title: 
//       content:
//     }
//   ] 
// }
// Error handling:
// Return status 403 (Forbidden) with JSON {error: 'Not logged in.'} if there is no user logged in.
// Return status 500 with JSON {error: 'Error querying database.'} for any database query errors.
    
    // TODO: get the correct posts to show on current user's feed
    const user_id = req.session.user_id

    if (user_id == null) 
        return res.status(403).json({error: 'Not logged in.'});

    try {
        const names = await db.send_sql(`SELECT linked_nconst FROM users WHERE user_id = ${user_id}`);

        const feed = await db.send_sql(`SELECT posts.post_id, posts.title, posts.content, names.primaryName 
                                        FROM posts 
                                        JOIN users ON posts.author_id = users.user_id 
                                        JOIN names ON names.nconst = '${names[0]['linked_nconst']}' 
                                        OR names.nconst = users.linked_nconst`);
        return res.status(200).json({results: feed});

    } catch(err) {
       return res.status(500).json({error: 'Error querying database.'});

    }
    

}


var getMovie = async function(req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const prompt =
    PromptTemplate.fromTemplate(`Give me a movie recommednationt`);
    const llm = new ChatOpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-3.5-turbo",
        temperature: 0  
    });
   // TODO: replace with your language model

    const ragChain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: new RunnablePassthrough(),
          },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    console.log(req.body.question);

    result = await ragChain.invoke(req.body.question);
    console.log(result);
    res.status(200).json({message:result});
}


/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = { 
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout, 
    get_friends: getFriends,
    get_friend_recs: getFriendRecs,
    get_movie: getMovie,
    create_post: createPost,
    get_feed: getFeed
  };


module.exports = routes;

