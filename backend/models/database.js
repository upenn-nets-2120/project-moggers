// db schemas/models
var AWS = require('aws-sdk');
const configFile = fs.readFileSync('../config.json', 'utf8');
const config = JSON.parse(configFile);

// RDS connection
AWS.config.update({ region: config.awsRegion });
var db = new AWS.RDSDataService();

async function create_tables() {
    let q1 = db.create_tables(`CREATE TABLE IF NOT EXISTS friends (
        follower INT NOT NULL,
        followed INT NOT NULL,
        PRIMARY KEY (follower, followed),
        FOREIGN KEY (follower) REFERENCES users(id),
        FOREIGN KEY (followed) REFERENCES users(id)
    )`);

    let q2 = db.create_tables(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        affiliation VARCHAR(255),
        birthday DATE,
        interests VARCHAR(255),
        FOREIGN KEY (id) REFERENCES friends(follower),
        FOREIGN KEY (id) REFERENCES friends(followed),
        FOREIGN KEY (id) REFERENCES posts(author),
        FOREIGN KEY (id) REFERENCES comments(author),
        FOREIGN KEY (id) REFERENCES likes(user_id)
    )`);

    let q3 = db.create_tables(`CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author INT NOT NULL,
        content TEXT NOT NULL,
        date_posted DATE NOT NULL,
        num_likes INT NOT NULL,
        timstamp TIMESTAMP NOT NULL,
        FOREIGN KEY (author) REFERENCES users(id),
        FOREIGN KEY (id) REFERENCES comments(post_id),
        FOREIGN KEY (id) REFERENCES likes(post_id),
        FOREIGN KEY (id) REFERENCES messages(author)
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
        name VARCHAR(255),
        users VARCHAR(255),
        messages INT,
        FOREIGN KEY (users) REFERENCES users(id),
        FOREIGN KEY (messages) REFERENCES messages(id)
    )`);

    let q7 = db.create_tables(`CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author INT,
        timstamp TIMESTAMP NOT NULL,
        chat_id INT,
        content TEXT,
        FOREIGN KEY (author) REFERENCES users(id),
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
    )`);

    return await Promise.all([q1, q2, q3, q4, q5, q6, q7]).then(async () => { 
    await dbaccess.close_db(db);
    console.log('closed db' );
  });
}

// Database connection setup
const db = dbaccess.get_db_connection();

create_tables(dbaccess).then(() => {
console.log('Tables created');
}).catch((err) => {
console.log('Error creating tables:', err);
});
// db.close_db():
const PORT = config.serverPort;