const express = require('express');
const session = require('express-session');

var db = require('../models/database.js');

const router = express.Router();

// all functions for handling data, calling the database, post/get requests, etc.