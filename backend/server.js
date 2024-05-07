const express = require('express');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');

const {S3Client, GetObjectCommand} = require("@aws-sdk/client-s3");
const {ChromaClient} = require("chromadb");

const configFile = fs.readFileSync('config.json', 'utf8');
const config = JSON.parse(configFile);

const app = express();
const port = config.serverPort || 8080;
const userRouter = require('./routes/routes');

app.use(cors());

app.use(session({
  secret: 'moggers',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true } // Uncomment this line when using HTTPS
}));

// app.get('/', (req, res) => {
//   res.send('Welcome to Moggerstagram');
// });


app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




///// SOCKET STUFF can be on same port so I add here
// const httpServer = require("http").createServer();
// const io = require("socket.io")(httpServer, {
//   // ...
// });
const http = require("http").Server(app);
const io = require("socket.io")(http);

// let users = []; // array where each user is {userId, socketId}

// const addUser = (userId, socketId) => {
//   if (!users.some((user) => user.userId === userId)) {
//     // not already inside so push
//     users.push({userId, socketId});
//   }
// };

// const removeUser = (socketId) => {
//   users = users.filter(user => user.socketId !== socketId);
// };

// const getUser = (userId) => {
//   return users.find((user) => user.userId === userId);
// };

// when a client connects 
io.on("connection", function (socket) {
  console.log("Socket: a user connected");

  // a chat message is sent
  socket.on("chat message", obj => {
    io.to(obj.room).emit("chat message", obj);
  });

  // client clicks on a room/chat 
  socket.on("join room", obj => {
    socket.join(obj.room);
  });

  // client leaves a room
  socket.on("leave room", obj => {
    socket.leave(obj.room);
  });
});



httpServer.listen(port);