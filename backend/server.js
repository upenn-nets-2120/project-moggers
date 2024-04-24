const express = require('express');
const fs = require('fs');
const cors = require('cors');

const {S3Client, GetObjectCommand} = require("@aws-sdk/client-s3");
const {ChromaClient} = require("chromadb");

const configFile = fs.readFileSync('config.json', 'utf8');
const config = JSON.parse(configFile);

const app = express();
const port = config.serverPort || 8080;
const userRouter = require('./routes/routes');

app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to Moggerstagram');
});


app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});