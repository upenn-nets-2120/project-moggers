// db schemas/models
const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

function sendQueryOrCommand(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }


async function create_tables(db) {
    console.log("hello!!!!");

    let q1 = db.create_tables(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        affiliation VARCHAR(255),
        profilePhoto VARCHAR(255),
        hashtags VARCHAR(255), 
        birthday DATE,
        status BOOL,
        interests VARCHAR(255)
    )`);

    let q2= db.create_tables(`CREATE TABLE IF NOT EXISTS friends (
        follower INT NOT NULL,
        followed INT NOT NULL,
        PRIMARY KEY (follower, followed),
        FOREIGN KEY (follower) REFERENCES users(id),
        FOREIGN KEY (followed) REFERENCES users(id)
    )`);

    let q13= db.create_tables(`CREATE TABLE IF NOT EXISTS friendRequests (
      follower INT NOT NULL,
      followed INT NOT NULL,
      PRIMARY KEY (follower, followed),
      FOREIGN KEY (follower) REFERENCES users(id),
      FOREIGN KEY (followed) REFERENCES users(id)
    )`);

    let q3 = db.create_tables(`CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author INT NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(255) NOT NULL,
        date_posted DATE NOT NULL,
        num_likes INT NOT NULL,
        timstamp TIMESTAMP NOT NULL,
        FOREIGN KEY (author) REFERENCES users(id)
    )`);

    let q4 = db.create_tables(`CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        parent_post INT,
        author INT NOT NULL,
        content TEXT NOT NULL,
        date_posted DATE NOT NULL,
        timstamp TIMESTAMP NOT NULL,
        FOREIGN KEY (parent_post) REFERENCES comments(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (author) REFERENCES users(id)
    )`);

    let q5 = db.create_tables(`CREATE TABLE IF NOT EXISTS likes (
        post_id INT,
        user_id INT,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    let q6 = db.create_tables(`CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255)
    )`);

    let q10 = db.create_tables(`CREATE TABLE IF NOT EXISTS user_chats (
        user_id INT,
        chat_id INT,
        PRIMARY KEY (user_id, chat_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (chat_id) REFERENCES chats(id)
    
    )`);

    let q11 = db.create_tables(`CREATE TABLE IF NOT EXISTS interests (
      name VARCHAR(255),
      count INT,
      PRIMARY KEY (name)
    )`);

    let q12 = db.create_tables(`CREATE TABLE IF NOT EXISTS hashtags (
      name VARCHAR(255),
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    let q14 = db.create_tables(`CREATE TABLE IF NOT EXISTS hashtagPosts (
      name VARCHAR(255),
      hashID INT,
      FOREIGN KEY (hashID) REFERENCES posts(id)
    )`);

    let q7 = db.create_tables(`CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author INT,
        timstamp TIMESTAMP NOT NULL,
        chat_id INT,
        content TEXT,
        FOREIGN KEY (author) REFERENCES users(id),
        FOREIGN KEY (chat_id) REFERENCES chats(id)
    )`);

    return await Promise.all([q1, q2, q3, q4, q5, q6, q7, q11, q13, q12,q14]).then(async () => { 
     
    await dbaccess.close_db(db);
    console.log('closed db' );
  });
}

// Database connection setup
const db = dbaccess.get_db_connection();
var result = create_tables(dbaccess);
console.log('Tables created');


const PORT = config.serverPort;