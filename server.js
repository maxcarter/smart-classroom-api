const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const log = require('winston');
const mongoose = require('mongoose');

var config = require('./config');
var app = express();

let mode = 'dev';
let server = config.dev;

log.add(log.transports.File, {
    filename: config.log
});

if (config.mode === 'PROD') {
    log.remove(log.transports.Console);
    mode = 'tiny';
    server = config.prod;
}

mongoose.Promise = global.Promise;
//mongodb://user:password@host:port/name
mongoose.connect('mongodb://' +
    server.database.user + ':' + server.database.password +
    '@' + server.database.host + ':' + server.database.port +
    '/' + server.database.name);

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(morgan(mode));

require('./api')(app);

app.listen(server.port, server.host, () => {
    log.info(`Server listening on port: ${server.port}`);
});