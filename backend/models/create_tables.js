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

  // These tables should already exist from prior homeworks.
  // We include them in case you need to recreate the database.

  // You'll need to define the names table.
  // var qa = db.create_tables('...');

  // var qb = db.create_tables('CREATE TABLE IF NOT EXISTS titles ( \
  //   tconst VARCHAR(10) PRIMARY KEY, \
  //   titleType varchar(255), \
  //   primaryTitle VARCHAR(255), \
  //   originalTitle VARCHAR(255), \
  //   startYear varchar(4), \
  //   endYear varchar(4), \
  //   genres VARCHAR(255) \
  //   );')

  //   var qc = db.create_tables('CREATE TABLE IF NOT EXISTS principals ( \
  //     tconst VARCHAR(10), \
  //     ordering int, \
  //     nconst VARCHAR(10), \
  //     category VARCHAR(255), \
  //     job VARCHAR(255), \
  //     characters VARCHAR(255), \
  //     FOREIGN KEY (tconst) REFERENCES titles(tconst), \
  //     FOREIGN KEY (nconst) REFERENCES names(nconst_short) \
  //     );')

  //   var qd = db.create_tables('CREATE TABLE IF NOT EXISTS recommendations ( \
  //     person VARCHAR(10), \
  //     recommendation VARCHAR(10), \
  //     strength int, \
  //     FOREIGN KEY (person) REFERENCES names(nconst_short), \
  //     FOREIGN KEY (recommendation) REFERENCES names(nconst_short) \
  //     );')
  



  // This table should already exist from HW3
  var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
    followed VARCHAR(10), \
    follower VARCHAR(10), \
    FOREIGN KEY (follower) REFERENCES names(nconst), \
    FOREIGN KEY (followed) REFERENCES names(nconst) \
    );')

    // TODO: create users table
    var q2 = db.create_tables(
      'CREATE TABLE IF NOT EXISTS users ( \
        user_id int NOT NULL AUTO_INCREMENT PRIMARY KEY, \
        username VARCHAR(255), \
        hashed_password VARCHAR(255), \
        linked_nconst VARCHAR(10), \
        FOREIGN KEY (linked_nconst) REFERENCES names(nconst) \
        );'
    );
    
    // TODO: create posts table
    var q3 = db.create_tables(
      'CREATE TABLE IF NOT EXISTS posts ( \
        post_id int NOT NULL AUTO_INCREMENT PRIMARY KEY, \
        parent_post int, \
        title VARCHAR(255), \
        content VARCHAR(255), \
        author_id int, \
        FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
        FOREIGN KEY (author_id) REFERENCES users(user_id) \
        );'
    );    

    return await Promise.all([q1, q2, q3]).then(async () => {
      // Once all tables are created, close the database connection
      await dbaccess.close_db();
      console.log("dbaccess closed db");
    });
}

// Database connection setup
const db = dbaccess.get_db_connection();
var result = create_tables(dbaccess);
console.log('Tables created');


const PORT = config.serverPort;