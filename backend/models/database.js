// db schemas/models
var AWS = require('aws-sdk');
const configFile = fs.readFileSync('../config.json', 'utf8');
const config = JSON.parse(configFile);

// RDS connection
AWS.config.update({ region: config.awsRegion });
var db = new AWS.RDSDataService();