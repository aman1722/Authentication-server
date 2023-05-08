const mongoos = require("mongoose");
const { createClient } = require('redis');
require("dotenv").config()

const connection  = mongoos.connect(process.env.MONGO_URL);

const client = createClient({
    url: process.env.REDIS
});

module.exports={connection, client}